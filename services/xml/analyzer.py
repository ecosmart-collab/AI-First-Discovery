"""Triagem local de XMLs. Não consulta SEFAZ nem verifica assinatura criptográfica."""
from functools import lru_cache
from hashlib import sha256
from importlib.metadata import version
from pathlib import Path
import re
import time
from threading import Lock

from defusedxml import ElementTree as SafeET
from defusedxml.common import DefusedXmlException
from erpbrasil.base.fiscal.cnpj_cpf import validar_cnpj, validar_cpf
from erpbrasil.base.fiscal.dfe import ChaveDFe
from lxml import etree
import nfelib
from nfelib.nfe.bindings.v4_0.nfe_v4_00 import Nfe
from nfelib.nfe.bindings.v4_0.proc_nfe_v4_00 import NfeProc
from xsdata.exceptions import ParserError

NS = "http://www.portalfiscal.inf.br/nfe"
MAX_FILE_BYTES = 250 * 1024
MAX_FILES = 10
SCHEMA_LOCK = Lock()


@lru_cache(maxsize=2)
def schema_for(root_name):
    filename = "procNFe_v4.00.xsd" if root_name == "nfeProc" else "nfe_v4.00.xsd"
    path = Path(nfelib.__path__[0]) / "nfe" / "schemas" / "v4_0" / filename
    parser = etree.XMLParser(resolve_entities=False, no_network=True, load_dtd=False)
    return etree.XMLSchema(etree.parse(str(path), parser))


def safe_name(name):
    return re.sub(r"[\x00-\x1f\x7f]", "", name.replace("\\", "/").split("/")[-1])[:160] or "documento.xml"


def finding(code, message, severity="warning"):
    return {"code": code, "message": message, "severity": severity}


def text(node, path):
    found = node.find("/".join("{%s}%s" % (NS, part) for part in path.split("/")))
    return found.text.strip() if found is not None and found.text else ""


def analyze_document(name, content):
    raw = content.encode("utf-8")
    result = {"filename": safe_name(name), "sha256": sha256(raw).hexdigest(),
              "key": "", "model": "", "number": "", "series": "", "issuedAt": "",
              "issuerMasked": "", "total": "", "schemaValid": None,
              "supported": False, "findings": []}
    issues = result["findings"]
    if not raw or len(raw) > MAX_FILE_BYTES:
        issues.append(finding("FILE_SIZE", "Arquivo vazio ou maior que 250 KiB.", "error"))
        return result
    try:
        root = SafeET.fromstring(raw, forbid_dtd=True, forbid_entities=True, forbid_external=True)
    except DefusedXmlException:
        issues.append(finding("UNSAFE_XML", "DTD ou entidades externas não são permitidas.", "error"))
        return result
    except (SafeET.ParseError, ValueError, LookupError):
        issues.append(finding("MALFORMED_XML", "XML não pôde ser lido. Verifique sintaxe e codificação UTF-8.", "error"))
        return result
    stack = [(root, 1)]
    nodes = 0
    while stack:
        node, depth = stack.pop()
        nodes += 1
        if depth > 80 or nodes > 15000:
            issues.append(finding("XML_COMPLEXITY", "XML excede os limites de profundidade ou quantidade de elementos.", "error"))
            return result
        stack.extend((child, depth + 1) for child in node)
    root_name = root.tag.split("}")[-1]
    if root.tag not in (f"{{{NS}}}NFe", f"{{{NS}}}nfeProc"):
        issues.append(finding("UNSUPPORTED_DOCUMENT", "Tipo fora do escopo: este piloto analisa NFe/nfeProc 4.00."))
        return result
    nfe = root if root_name == "NFe" else root.find(f"{{{NS}}}NFe")
    info = nfe.find(f"{{{NS}}}infNFe") if nfe is not None else None
    if info is None:
        result["supported"] = True
        result["schemaValid"] = False
        issues.append(finding("MISSING_INFO", "O grupo obrigatório infNFe não foi encontrado.", "error"))
        return result
    if info.attrib.get("versao") != "4.00":
        issues.append(finding("UNSUPPORTED_VERSION", "Versão fora do escopo. Utilize o leiaute 4.00."))
        return result
    result["model"] = text(info, "ide/mod")
    if result["model"] not in ("55", "65"):
        issues.append(finding("UNSUPPORTED_MODEL", "Modelo fora do escopo: somente NF-e 55 e NFC-e 65."))
        return result
    result["supported"] = True
    result.update(number=text(info, "ide/nNF")[:9], series=text(info, "ide/serie")[:3],
                  issuedAt=text(info, "ide/dhEmi")[:35], total=text(info, "total/ICMSTot/vNF")[:20])
    issuer = text(info, "emit/CNPJ") or text(info, "emit/CPF")
    result["issuerMasked"] = "***" + issuer[-4:] if issuer else ""
    if not issuer or not (validar_cnpj(issuer) if len(issuer) == 14 else validar_cpf(issuer)):
        issues.append(finding("INVALID_ISSUER", "CPF/CNPJ do emitente não passou na validação de formato e dígitos.", "error"))
    recipient = text(info, "dest/CNPJ") or text(info, "dest/CPF")
    if recipient and not (validar_cnpj(recipient) if len(recipient) == 14 else validar_cpf(recipient)):
        issues.append(finding("INVALID_RECIPIENT", "CPF/CNPJ do destinatário não passou na validação de formato e dígitos.", "error"))
    raw_id = info.attrib.get("Id", "")
    key = raw_id[3:] if raw_id.startswith("NFe") else ""
    # O trecho CNPJ da chave pode ser alfanumérico; os demais campos são numéricos.
    if re.fullmatch(r"\d{6}[A-Z0-9]{12}\d{26}", key or ""):
        result["key"] = key
    try:
        access = ChaveDFe(chave=key, validar=True)
        expected = {"cUF": text(info, "ide/cUF"), "mod": result["model"],
                    "serie": result["series"].zfill(3), "nNF": result["number"].zfill(9),
                    "tpEmis": text(info, "ide/tpEmis"), "cNF": text(info, "ide/cNF"),
                    "cDV": text(info, "ide/cDV")}
        inconsistent = any(str(getattr(access, field)).zfill(len(value)) != value for field, value in expected.items() if value)
        if issuer and re.sub(r"[^A-Z0-9]", "", access.cnpj_cpf_emitente.upper()) != issuer.zfill(14):
            inconsistent = True
        issued = result["issuedAt"]
        if re.match(r"\d{4}-\d{2}-", issued) and key[2:6] != issued[2:4] + issued[5:7]:
            inconsistent = True
        if inconsistent:
            issues.append(finding("KEY_FIELDS_MISMATCH", "Os campos da chave divergem dos dados de identificação ou do emitente.", "error"))
    except (ValueError, TypeError, IndexError):
        issues.append(finding("INVALID_KEY", "Chave de acesso ausente ou inválida nos controles da erpbrasil.base.", "error"))
    parser = etree.XMLParser(resolve_entities=False, no_network=True, load_dtd=False, huge_tree=False)
    try:
        original = etree.fromstring(raw, parser)
        schema = schema_for(root_name)
        with SCHEMA_LOCK:
            result["schemaValid"] = schema.validate(original)
            errors = list(schema.error_log)
        if not result["schemaValid"]:
            # Não persiste mensagens XSD completas, que podem conter valores do documento.
            for error in errors[:8]:
                issues.append(finding("XSD_INVALID", f"Falha estrutural XSD: {error.type_name}, linha {error.line}.", "error"))
        else:
            binding = (Nfe if root_name == "NFe" else NfeProc).from_xml(content)
            bound_nfe = binding if root_name == "NFe" else binding.NFe
            if str(bound_nfe.infNFe.ide.mod.value) != result["model"]:
                issues.append(finding("BINDING_MISMATCH", "Modelo retornado pela nfelib diverge do XML.", "error"))
    except (etree.XMLSyntaxError, ValueError, TypeError, AttributeError, ParserError):
        result["schemaValid"] = False
        issues.append(finding("BINDING_ERROR", "O documento não pôde ser interpretado pelos bindings do leiaute.", "error"))
    if root_name == "nfeProc":
        protocol_key = text(root, "protNFe/infProt/chNFe")
        status = text(root, "protNFe/infProt/cStat")
        if protocol_key != key:
            issues.append(finding("PROTOCOL_KEY_MISMATCH", "A chave do protocolo diverge da chave do documento.", "error"))
        if status not in ("100", "150"):
            issues.append(finding("PROTOCOL_STATUS", "O status informado no XML não é um código de autorização esperado. Revisar."))
    else:
        issues.append(finding("NO_PROTOCOL", "XML sem protocolo anexado. A autorização não foi verificada."))
    return result


def analyze_batch(files):
    start = time.perf_counter()
    results = []
    hashes = {}
    keys = {}
    for item in files:
        result = analyze_document(item["name"], item["content"])
        previous = hashes.get(result["sha256"])
        if previous is not None:
            result["findings"].append(finding("DUPLICATE_CONTENT", f"Conteúdo idêntico ao arquivo {previous + 1} deste lote."))
        hashes.setdefault(result["sha256"], len(results))
        if result["key"]:
            previous_key = keys.get(result["key"])
            if previous_key is not None:
                result["findings"].append(finding("DUPLICATE_KEY", f"Chave repetida no arquivo {previous_key + 1} deste lote."))
            keys.setdefault(result["key"], len(results))
        results.append(result)
    return {"documents": results, "processingMs": round((time.perf_counter() - start) * 1000, 2),
            "engine": {"nfelib": version("nfelib"), "erpbrasil.base": version("erpbrasil.base"), "scope": "NF-e/NFC-e 4.00"}}

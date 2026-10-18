import os
import unittest
from fastapi.testclient import TestClient
from fixtures import synthetic_nfe
from analyzer import analyze_document, analyze_batch
from app import app


class AnalyzerTests(unittest.TestCase):
    def test_valid_processed_invoice_and_metadata(self):
        result = analyze_document("nota.xml", synthetic_nfe())
        self.assertTrue(result["supported"])
        self.assertTrue(result["schemaValid"], result["findings"])
        self.assertEqual(result["findings"], [])
        self.assertEqual(result["total"], "100.00")
        self.assertEqual(result["issuerMasked"], "***0195")
        self.assertNotIn("content", result)

    def test_duplicate_content_and_key(self):
        xml = synthetic_nfe()
        report = analyze_batch([{"name": "a.xml", "content": xml}, {"name": "b.xml", "content": xml}])
        self.assertEqual({f["code"] for f in report["documents"][1]["findings"]}, {"DUPLICATE_KEY", "DUPLICATE_CONTENT"})

    def test_malformed_unsupported_and_external_entities(self):
        for xml, code in [("<broken>", "MALFORMED_XML"), ("<recibo/>", "UNSUPPORTED_DOCUMENT"),
                          ('<!DOCTYPE a [<!ENTITY x SYSTEM "file:///etc/passwd">]><a>&x;</a>', "UNSAFE_XML")]:
            result = analyze_document("nota.xml", xml)
            self.assertIn(code, [f["code"] for f in result["findings"]])

    def test_structure_key_and_issuer_fail_independently(self):
        xml = synthetic_nfe().replace("<vNF>100.00</vNF>", "")
        self.assertFalse(analyze_document("a.xml", xml)["schemaValid"])
        xml = synthetic_nfe().replace("<nNF>1</nNF>", "<nNF>2</nNF>")
        self.assertIn("KEY_FIELDS_MISMATCH", [f["code"] for f in analyze_document("a.xml", xml)["findings"]])
        xml = synthetic_nfe().replace("<CNPJ>12345678000195</CNPJ>", "<CNPJ>12345678000100</CNPJ>", 1)
        self.assertIn("INVALID_ISSUER", [f["code"] for f in analyze_document("a.xml", xml)["findings"]])

    def test_missing_protocol_is_not_claimed_as_authorized(self):
        result = analyze_document("a.xml", synthetic_nfe(processed=False))
        self.assertTrue(result["schemaValid"], result["findings"])
        self.assertIn("NO_PROTOCOL", [f["code"] for f in result["findings"]])

    def test_alphanumeric_cnpj_and_key_are_supported(self):
        result = analyze_document("alfa.xml", synthetic_nfe(issuer="12ABC34501DE35"))
        self.assertTrue(result["schemaValid"], result["findings"])
        self.assertEqual(result["findings"], [])

    def test_service_requires_token_and_bounds_input(self):
        os.environ["XML_SERVICE_TOKEN"] = "s" * 48
        with TestClient(app) as client:
            self.assertEqual(client.get("/health").status_code, 200)
            self.assertEqual(client.post("/analyze", json={"files": []}).status_code, 401)
            headers = {"Authorization": "Bearer " + "s" * 48}
            self.assertEqual(client.post("/analyze", headers=headers, json={"files": []}).status_code, 422)
            invalid = client.post("/analyze", headers=headers, json={"files": [{"name": "a.xml", "content": "confidencial", "unexpected": True}]})
            self.assertEqual(invalid.status_code, 422)
            self.assertNotIn("confidencial", invalid.text)
            self.assertEqual(client.post("/analyze", headers=headers, content=b"x" * (3*1024*1024+1)).status_code, 413)
            response = client.post("/analyze", headers=headers, json={"files": [{"name": "a.xml", "content": synthetic_nfe()}]})
            self.assertEqual(response.status_code, 200)
            self.assertTrue(response.json()["documents"][0]["schemaValid"])


if __name__ == "__main__":
    unittest.main()

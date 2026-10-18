# Piloto de triagem de XMLs

O menu **Piloto XML** permite analisar lotes vinculados a um escritório e, opcionalmente, a uma oportunidade. Os controles combinam **nfelib 3.2.0** e **erpbrasil.base 2.5.1**, em um serviço Python interno, sem transmissão de documentos a serviços fiscais ou provedores de IA.

## O que é verificado

- XML bem formado, namespace, tipo de documento e versão.
- NF-e modelo 55 e NFC-e modelo 65, leiaute 4.00, nos formatos `NFe` e `nfeProc`.
- XSD original distribuído com a versão fixada da nfelib, aplicado ao XML recebido, e leitura pelos bindings.
- CPF/CNPJ do emitente e, quando informado, do destinatário. CNPJ alfanumérico foi testado com amostra sintética.
- Dígitos e controles da chave de acesso, consistência com emitente, identificação e mês de emissão.
- Chave e código de status do protocolo anexado, quando existente.
- Repetição do conteúdo (hash SHA-256) e da chave no lote e no histórico **do mesmo escritório**.

Uma passagem pelo XSD não comprova validade fiscal. Este piloto não verifica assinatura criptográfica, certificado, autorização/cancelamento atual na SEFAZ, tributos, enquadramento fiscal ou todas as regras de negócio das notas técnicas. Os XSDs são os da dependência fixada; para atualizar leiautes, atualize as bibliotecas e repita os testes antes de produção. Documentos de outros tipos/versões ficam fora do escopo, sem serem declarados fiscalmente inválidos.

## Fluxo

1. Selecione escritório e, se aplicável, oportunidade de origem.
2. Informe o tempo manual de referência somente se houver medição do mesmo lote ou amostra equivalente.
3. Selecione de 1 a 10 XMLs, com até 250 KiB cada; ZIPs não são aceitos. O corpo JSON tem limite de 3 MiB e o proxy aceita até 3 MB nessa rota.
4. Confirme que há autorização para análise e registro dos metadados.
5. Analise e revise as ocorrências. Cada documento começa como **Pendente**, independentemente do resultado automático.
6. Registre a decisão humana, a nota de revisão e o tempo observado de revisão. Salve e exporte o CSV se necessário.

O tempo assistido mostrado é o tempo de análise no servidor (incluindo a chamada ao serviço Python) somado ao tempo de revisão informado. Upload, navegação e outras tarefas não estão incluídos; considere esses limites na comparação. A diferença para a referência pode ser negativa; não é uma promessa de economia. O aplicativo não transforma automaticamente o resultado em score, evidência validada, ROI ou autorização para implantar.

## Dados e limites

Os XMLs originais são processados em memória e descartados. O SQLite guarda nome do arquivo, hash, chave, identificação resumida, total informado, emitente mascarado, ocorrências, versões das bibliotecas, tempos e revisões. Chaves de acesso e nomes de arquivos também podem identificar contribuintes: aplique a mesma política de acesso e retenção dos demais registros.

O histórico na tela mostra os últimos 30 lotes do escritório; a comparação de duplicidades considera todos os lotes ainda armazenados desse escritório. Excluir um lote também remove sua participação nas comparações futuras. A exportação JSON do workspace inclui todos os lotes e revisões. Escritórios e oportunidades com lotes vinculados têm exclusão/mudança de escritório bloqueada até remover os vínculos.

Há apenas uma análise simultânea no processo Node. Requisições adicionais recebem 429. O serviço usa segredo interno, limite de corpo, parser sem DTD/entidades externas e limites de profundidade/nós. Em Docker, roda sem privilégios e em rede interna sem acesso externo e sem porta publicada.

## Configurar na VPS

Novas instalações com `scripts/setup-vps.mjs` já geram `XML_SERVICE_TOKEN`. Se `.env.production` foi criado antes do piloto, execute na pasta do projeto:

```bash
node scripts/setup-xml.mjs
```

Alternativa com Docker, para um host sem Node instalado:

```bash
docker run --rm --user "$(id -u):$(id -g)" \
  --mount "type=bind,src=$PWD,dst=/setup" \
  --workdir /setup node:24-bookworm-slim node scripts/setup-xml.mjs
```

Esse passo acrescenta somente o segredo interno ao arquivo existente; não altera a senha do proprietário. O segredo é compartilhado entre backend e analisador e não deve ir para o navegador ou Git.

```bash
docker compose --env-file .env.production config --quiet
docker compose --env-file .env.production up -d --build
docker compose --env-file .env.production ps
```

O Compose sobe o analisador primeiro. Depois, inicia a aplicação e o Caddy. A rota de upload tem limite próprio no Caddy; as demais rotas mantêm 150 KB.

## Desenvolvimento local

```bash
python3 -m venv .venv
.venv/bin/pip install -r services/xml/requirements.txt
```

Configure `XML_SERVICE_TOKEN` com pelo menos 32 caracteres no ambiente do serviço Python e o mesmo valor em `.env.local` da aplicação, junto de `XML_SERVICE_URL=http://127.0.0.1:8000`. Inicie o serviço:

```bash
cd services/xml
../../.venv/bin/uvicorn app:app --host 127.0.0.1 --port 8000 --no-access-log
```

Em outro terminal, inicie `npm run dev`. Entre e use **Carregar amostra sintética**: há um XML estruturalmente válido, uma cópia duplicada e um XML malformado. A assinatura da amostra é artificial, sem valor fiscal.

## Testes

```bash
npm test
cd services/xml
../../.venv/bin/python -m unittest discover -s tests -v
```

Os testes cobrem documento sintético com e sem protocolo, CNPJ alfanumérico, estrutura, consistência de chave, documentos inválidos, entidades externas, autenticação do serviço, limites, persistência sem XML original, segregação das duplicidades e revisão com controle de versão.

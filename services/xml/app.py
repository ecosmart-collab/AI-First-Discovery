import hmac
import os
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field, ValidationError
from starlette.concurrency import run_in_threadpool
from analyzer import MAX_FILES, MAX_FILE_BYTES, analyze_batch, schema_for

MAX_BODY_BYTES = 3 * 1024 * 1024
app = FastAPI(title="XML Pilot", docs_url=None, redoc_url=None, openapi_url=None)


class Document(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=1, max_length=MAX_FILE_BYTES)


class Batch(BaseModel):
    model_config = ConfigDict(extra="forbid")
    files: list[Document] = Field(min_length=1, max_length=MAX_FILES)


@app.get("/health")
def health():
    if len(os.environ.get("XML_SERVICE_TOKEN", "")) < 32:
        raise HTTPException(503, "Serviço não configurado.")
    schema_for("NFe")
    schema_for("nfeProc")
    return {"ok": True}


@app.post("/analyze")
async def analyze(request: Request):
    expected = os.environ.get("XML_SERVICE_TOKEN", "")
    provided = request.headers.get("authorization", "")
    if len(expected) < 32 or not hmac.compare_digest(provided, "Bearer " + expected):
        raise HTTPException(401, "Acesso restrito.")
    body = bytearray()
    async for chunk in request.stream():
        body.extend(chunk)
        if len(body) > MAX_BODY_BYTES:
            raise HTTPException(413, "Lote muito grande.")
    try:
        batch = Batch.model_validate_json(body)
    except ValidationError:
        raise HTTPException(422, "Lote inválido. Envie de 1 a 10 arquivos XML de até 250 KiB.")
    if any(len(doc.content.encode("utf-8")) > MAX_FILE_BYTES for doc in batch.files):
        raise HTTPException(413, "Arquivo maior que 250 KiB.")
    return await run_in_threadpool(analyze_batch, [item.model_dump() for item in batch.files])

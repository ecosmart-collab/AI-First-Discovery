import { randomUUID } from 'node:crypto';
import { db, getRecord, audit, parseRow } from './db.mjs';

export const XML_MAX_FILES=10;
export const XML_MAX_FILE_BYTES=250*1024;
export const XML_MAX_BODY_BYTES=3*1024*1024;
const message=(text,status=400)=>Object.assign(new Error(text),{status});
const trim=(v,n=200)=>typeof v==='string'?v.trim().slice(0,n):'';
const minutes=v=>{if(v===''||v==null)return null;const n=Number(v);if(!Number.isFinite(n)||n<0||n>100000)throw message('Tempo inválido. Use minutos entre 0 e 100000.');return n;};

export async function readLimitedJSON(request,limit=XML_MAX_BODY_BYTES){
  if(Number(request.headers.get('content-length')||0)>limit)throw message('Lote muito grande.',413);
  const reader=request.body?.getReader();if(!reader)throw message('Corpo da requisição ausente.');
  const chunks=[];let size=0;
  while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit){await reader.cancel();throw message('Lote muito grande.',413);}chunks.push(Buffer.from(value));}
  try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw message('JSON inválido.');}
}

export function validateXmlUpload(input){
  if(!input||input.authorized!==true)throw message('Confirme a autorização para analisar os documentos.');
  const officeId=trim(input.officeId),opportunityId=trim(input.opportunityId);
  if(!getRecord(officeId,'offices'))throw message('Escritório não encontrado.');
  if(opportunityId){const op=getRecord(opportunityId,'opportunities');if(!op||op.officeId!==officeId)throw message('A oportunidade não pertence ao escritório.');}
  if(!Array.isArray(input.files)||input.files.length<1||input.files.length>XML_MAX_FILES)throw message('Envie de 1 a 10 arquivos XML.');
  const files=input.files.map(file=>{
    if(typeof file?.name!=='string'||!file.name.toLowerCase().endsWith('.xml'))throw message('São aceitos somente arquivos .xml.');
    const name=file.name.replaceAll('\\','/').split('/').at(-1).replace(/[\x00-\x1f\x7f]/g,'').slice(0,160);
    if(typeof file.content!=='string'||!file.content.length||Buffer.byteLength(file.content)>XML_MAX_FILE_BYTES)throw message('Cada arquivo deve ter conteúdo e no máximo 250 KiB.',413);
    return {name,content:file.content};
  });
  return {officeId,opportunityId,title:trim(input.title,160)||'Análise de XMLs',manualMinutes:minutes(input.manualMinutes),files};
}

function checkedWorkerResult(result,files){
  if(!result||!Array.isArray(result.documents)||result.documents.length!==files.length||!Number.isFinite(result.processingMs)||result.processingMs<0)throw message('O serviço retornou um resultado inválido.',502);
  const fields={key:44,model:2,number:9,series:3,issuedAt:35,issuerMasked:10,total:20};
  const documents=result.documents.map((d,i)=>{
    if(!d||!/^[a-f0-9]{64}$/.test(d.sha256)||!Array.isArray(d.findings)||d.findings.length>20||!['boolean'].includes(typeof d.supported)||![null,true,false].includes(d.schemaValid))throw message('Resultado de documento inválido.',502);
    const record={id:randomUUID(),filename:files[i].name,sha256:d.sha256,supported:d.supported,schemaValid:d.schemaValid,reviewStatus:'Pendente',reviewNote:'',findings:d.findings.map(f=>({code:trim(f.code,60),message:trim(f.message,250),severity:f.severity==='error'?'error':'warning'}))};
    for(const [k,n] of Object.entries(fields))record[k]=trim(d[k],n);
    return record;
  });
  return {documents,processingMs:result.processingMs,engine:{nfelib:trim(result.engine?.nfelib,30),'erpbrasil.base':trim(result.engine?.['erpbrasil.base'],30),scope:trim(result.engine?.scope,50)}};
}

export function xmlBatches(officeId=''){
  const rows=officeId?db().prepare("SELECT * FROM records WHERE type='xmlBatches' AND json_extract(data,'$.officeId')=? ORDER BY updated_at DESC LIMIT 30").all(officeId):db().prepare("SELECT * FROM records WHERE type='xmlBatches' ORDER BY updated_at DESC LIMIT 30").all();
  return rows.map(parseRow).map(({documents,...batch})=>({...batch,count:documents.length,pending:documents.filter(d=>d.reviewStatus==='Pendente').length,exceptions:documents.filter(d=>d.findings.length).length}));
}

export async function analyzeXmlUpload(input,actor){
  const started=performance.now();
  const valid=validateXmlUpload(input);
  const endpoint=process.env.XML_SERVICE_URL,token=process.env.XML_SERVICE_TOKEN;
  if(!endpoint||!token||token.length<32)throw message('O analisador XML ainda não está configurado no servidor.',503);
  let response;
  try{response=await fetch(new URL('/analyze',endpoint),{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({files:valid.files}),signal:AbortSignal.timeout(35000)});}catch{throw message('O analisador está indisponível ou excedeu o tempo limite. Tente novamente.',503);}
  if(!response.ok)throw message('O analisador não concluiu o lote. Verifique limites e disponibilidade do serviço.',502);
  let result;try{result=checkedWorkerResult(await readLimitedJSON(response),valid.files);}catch(error){throw message(error.status===502?error.message:'Resposta inválida do analisador.',502);}
  result.engineProcessingMs=result.processingMs;
  result.processingMs=Math.round(Math.max(result.processingMs,performance.now()-started)*100)/100;
  // Revalida vínculos após o processamento; outro acesso pode ter excluído o escritório.
  if(!getRecord(valid.officeId,'offices'))throw message('O escritório foi excluído durante a análise.');
  if(valid.opportunityId){const op=getRecord(valid.opportunityId,'opportunities');if(!op||op.officeId!==valid.officeId)throw message('O vínculo com a oportunidade mudou durante a análise.');}
  const previous=db().prepare("SELECT data FROM records WHERE type='xmlBatches' AND json_extract(data,'$.officeId')=?").all(valid.officeId);
  const hashes=new Set(),keys=new Set();for(const row of previous)for(const d of JSON.parse(row.data).documents){hashes.add(d.sha256);if(d.key)keys.add(d.key);}
  for(const doc of result.documents){
    if(hashes.has(doc.sha256))doc.findings.push({code:'HISTORY_DUPLICATE_CONTENT',severity:'warning',message:'Conteúdo já analisado em outro lote deste escritório.'});
    if(doc.key&&keys.has(doc.key))doc.findings.push({code:'HISTORY_DUPLICATE_KEY',severity:'warning',message:'Chave já registrada em outro lote deste escritório.'});
  }
  const id=randomUUID(),now=new Date().toISOString();
  const data={title:valid.title,officeId:valid.officeId,opportunityId:valid.opportunityId,manualMinutes:valid.manualMinutes,reviewMinutes:null,authorizationConfirmedAt:now,...result};
  db().prepare('INSERT INTO records VALUES (?,?,?,?,?)').run(id,'xmlBatches',JSON.stringify(data),now,now);audit(actor,'analyze',id,'xmlBatches');
  return getRecord(id,'xmlBatches');
}

export function reviewXmlBatch(input,actor){
  const current=getRecord(trim(input?.id),'xmlBatches');if(!current)throw message('Lote não encontrado.',404);
  if(input.updatedAt!==current.updatedAt)throw message('O lote foi alterado em outra sessão. Abra-o novamente antes de salvar.',409);
  const {id,createdAt,updatedAt,...data}=current;
  if(input.documents!=null){
    if(!Array.isArray(input.documents)||input.documents.length!==data.documents.length)throw message('Lista de documentos inválida.');
    const mapped=new Map(input.documents.map(d=>[d.id,d]));if(mapped.size!==data.documents.length)throw message('Documentos repetidos ou ausentes.');
    data.documents=data.documents.map(d=>{const update=mapped.get(d.id);if(!update||!['Pendente','Conferido','Ajuste necessário','Descartado'].includes(update.reviewStatus))throw message('Revisão inválida.');return {...d,reviewStatus:update.reviewStatus,reviewNote:trim(update.reviewNote,1500)};});
  }
  if(Object.hasOwn(input,'manualMinutes'))data.manualMinutes=minutes(input.manualMinutes);
  if(Object.hasOwn(input,'reviewMinutes'))data.reviewMinutes=minutes(input.reviewMinutes);
  const now=new Date(Math.max(Date.now(),Date.parse(updatedAt)+1)).toISOString();
  db().prepare("UPDATE records SET data=?,updated_at=? WHERE id=? AND type='xmlBatches'").run(JSON.stringify(data),now,id);audit(actor,'review',id,'xmlBatches');return getRecord(id,'xmlBatches');
}

export function deleteXmlBatch(id,actor){
  if(!getRecord(id,'xmlBatches'))throw message('Lote não encontrado.',404);
  db().prepare("DELETE FROM records WHERE type='xmlBatches' AND id=?").run(id);audit(actor,'delete',id,'xmlBatches');
}

import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const dir=mkdtempSync(join(tmpdir(),'discovery-test-'));process.env.DATA_DIR=dir;
const {db,saveRecord,getRecord,listRecords,deleteRecord}=await import('../lib/db.mjs');
const {hashPassword,verifyPassword,login,getSession,logout,sameOrigin}=await import('../lib/auth.mjs');
const actor='test@example.com';
test.after(()=>{db().close();rmSync(dir,{recursive:true,force:true});});
test('persistência valida relacionamentos e bloqueia referências entre escritórios',()=>{
  const a=saveRecord('offices',{name:'Alfa'},actor),b=saveRecord('offices',{name:'Beta'},actor);
  const d=saveRecord('diagnostics',{title:'Entrevista',officeId:a.id,status:'Rascunho'},actor);
  const base={title:'Problema',area:'Fiscal',status:'Hipótese',officeId:b.id,ratings:{frequency:5,impact:5,payment:5,feasibility:5,reuse:5}};
  assert.throws(()=>saveRecord('opportunities',{...base,diagnosticId:d.id},actor),/não pertence/);
  const op=saveRecord('opportunities',{...base,officeId:a.id,diagnosticId:d.id},actor);
  assert.throws(()=>saveRecord('diagnostics',{...d,officeId:b.id},actor),/trocar o escritório/);
  assert.throws(()=>saveRecord('diagnostics',{title:'Falha',officeId:'inexistente',status:'Rascunho'},actor),/não encontrado/);
  assert.equal(getRecord(a.id,'offices').name,'Alfa');
  assert.throws(()=>deleteRecord('offices',a.id,actor),/vinculados/);
  const updated=saveRecord('offices',{...a,name:'Alfa atualizada'},actor);assert.equal(updated.name,'Alfa atualizada');
  assert.throws(()=>saveRecord('offices',{...a,updatedAt:'versão-antiga',name:'Conflito'},actor),/outra sessão/);
  deleteRecord('opportunities',op.id,actor);deleteRecord('diagnostics',d.id,actor);deleteRecord('offices',a.id,actor);assert.equal(getRecord(a.id,'offices'),null);
  assert.equal(listRecords('offices').length,1);
});
test('senha é protegida por scrypt; sessão pode ser revogada',()=>{
  const password='Senha de teste longa 123!';const hash=hashPassword(password);
  assert.ok(!hash.includes(password));assert.equal(verifyPassword(password,hash),true);assert.equal(verifyPassword('errada',hash),false);
  process.env.ADMIN_EMAIL=actor;process.env.ADMIN_PASSWORD_HASH=hash;
  assert.throws(()=>login(actor,'errada'),/incorretos/);
  const result=login(actor,password);assert.equal(getSession(result.token).email,actor);
  const row=db().prepare('SELECT token_hash FROM sessions').get();assert.notEqual(row.token_hash,result.token);
  logout(result.token);assert.equal(getSession(result.token),null);
});
test('limitação de tentativas impede força bruta no login',()=>{
  const email='attacker@example.com';for(let i=0;i<8;i++)assert.throws(()=>login(email,'errada'),/incorretos/);
  assert.throws(()=>login(email,'errada'),/Muitas tentativas/);
});
test('CSRF exige origem exata e suporta origem de proxy configurada',()=>{
  assert.equal(sameOrigin(new Request('https://local.test/api/data',{headers:{origin:'https://local.test'}})),true);
  assert.equal(sameOrigin(new Request('https://local.test/api/data',{headers:{origin:'https://evil.test'}})),false);
  assert.equal(sameOrigin(new Request('https://local.test/api/data')),false);
  assert.equal(sameOrigin(new Request('http://0.0.0.0:3000/api/data',{headers:{origin:'http://localhost:3000',host:'localhost:3000'}})),true);
  process.env.APP_ORIGIN='https://private.test';assert.equal(sameOrigin(new Request('http://localhost/api/data',{headers:{origin:'https://private.test'}})),true);delete process.env.APP_ORIGIN;
});

test('piloto XML preserva somente metadados, segrega duplicidades e protege os vínculos',async()=>{
  const {analyzeXmlUpload,reviewXmlBatch,deleteXmlBatch,validateXmlUpload}=await import('../lib/xml.mjs');
  const a=saveRecord('offices',{name:'XML Alfa'},actor),b=saveRecord('offices',{name:'XML Beta'},actor);
  const op=saveRecord('opportunities',{officeId:a.id,title:'Conferência XML',area:'Fiscal',status:'Hipótese',ratings:{frequency:3,impact:3,payment:3,feasibility:3,reuse:3}},actor);
  const content=readFileSync(new URL('../public/samples/nfe-sintetica.xml',import.meta.url),'utf8');
  const payload={officeId:a.id,opportunityId:op.id,title:'Lote',authorized:true,manualMinutes:10,files:[{name:'nota.xml',content}]};
  assert.throws(()=>validateXmlUpload({...payload,authorized:false}),/autorização/);
  assert.throws(()=>validateXmlUpload({...payload,officeId:b.id}),/não pertence/);
  assert.throws(()=>validateXmlUpload({...payload,files:Array(11).fill(payload.files[0])}),/1 a 10/);
  const originalFetch=globalThis.fetch;
  process.env.XML_SERVICE_URL='http://worker.test';process.env.XML_SERVICE_TOKEN='s'.repeat(48);
  globalThis.fetch=async()=>Response.json({documents:[{filename:'nota.xml',sha256:createHash('sha256').update(content).digest('hex'),key:'35261012345678000195550010000000011123456781',model:'55',supported:true,schemaValid:true,findings:[]}],processingMs:125,engine:{nfelib:'3.2.0','erpbrasil.base':'2.5.1',scope:'NF-e/NFC-e 4.00'}});
  try{
    const first=await analyzeXmlUpload(payload,actor);assert.equal(first.documents[0].findings.length,0);
    const stored=db().prepare('SELECT data FROM records WHERE id=?').get(first.id).data;assert.ok(!stored.includes('<NFe'));assert.ok(!stored.includes('content"'));
    const repeat=await analyzeXmlUpload(payload,actor);assert.equal(repeat.documents[0].findings.length,2);
    const other=await analyzeXmlUpload({...payload,officeId:b.id,opportunityId:''},actor);assert.equal(other.documents[0].findings.length,0);
    assert.throws(()=>deleteRecord('offices',a.id,actor),/vinculados/);
    assert.throws(()=>saveRecord('opportunities',{...op,officeId:b.id},actor),/trocar o escritório/);
    assert.throws(()=>reviewXmlBatch({...first,updatedAt:'stale'},actor),/outra sessão/);
    const reviewed=reviewXmlBatch({id:first.id,updatedAt:first.updatedAt,reviewMinutes:2,documents:first.documents.map(d=>({id:d.id,reviewStatus:'Conferido',reviewNote:'Conferido na amostra'}))},actor);
    assert.equal(reviewed.documents[0].reviewStatus,'Conferido');assert.equal(reviewed.reviewMinutes,2);
    assert.equal(reviewed.documents[0].schemaValid,true);
    for(const batch of [reviewed,repeat,other])deleteXmlBatch(batch.id,actor);
    deleteRecord('opportunities',op.id,actor);deleteRecord('offices',a.id,actor);deleteRecord('offices',b.id,actor);
  }finally{globalThis.fetch=originalFetch;delete process.env.XML_SERVICE_URL;delete process.env.XML_SERVICE_TOKEN;}
});

test('limite de upload é aplicado a requisições em streaming sem Content-Length',async()=>{
  const {readLimitedJSON}=await import('../lib/xml.mjs');
  const body=new ReadableStream({start(c){c.enqueue(new TextEncoder().encode('0123456789'));c.close();}});
  await assert.rejects(()=>readLimitedJSON(new Request('http://local/api/xml/analyze',{method:'POST',body,duplex:'half'}),5),/muito grande/);
  await assert.rejects(()=>readLimitedJSON(new Request('http://local',{method:'POST',body:'not JSON'})),/JSON inválido/);
});

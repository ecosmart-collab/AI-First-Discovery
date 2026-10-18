import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
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

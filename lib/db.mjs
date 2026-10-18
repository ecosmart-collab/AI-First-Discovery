import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { validateRecord } from './domain.mjs';

let connection;
export function db() {
  if (connection) return connection;
  const dir = resolve(process.env.DATA_DIR || './data');
  mkdirSync(dir, {recursive:true,mode:0o700});
  connection = new DatabaseSync(join(dir,'discovery.sqlite'));
  connection.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS records (id TEXT PRIMARY KEY, type TEXT NOT NULL, data TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS records_type ON records(type);
    CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, email TEXT NOT NULL, expires_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS attempts (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS audit (id TEXT PRIMARY KEY, actor TEXT NOT NULL, action TEXT NOT NULL, entity_id TEXT, entity_type TEXT, created_at TEXT NOT NULL);
  `);
  return connection;
}
export const parseRow = row => row ? {...JSON.parse(row.data),id:row.id,createdAt:row.created_at,updatedAt:row.updated_at} : null;
export function listRecords(type) { return db().prepare('SELECT * FROM records WHERE type=? ORDER BY updated_at DESC').all(type).map(parseRow); }
export function getRecord(id,type) { return parseRow(db().prepare('SELECT * FROM records WHERE id=? AND type=?').get(id,type)); }
export function audit(actor,action,id='',type='') { db().prepare('INSERT INTO audit VALUES (?,?,?,?,?,?)').run(randomUUID(),actor,action,id,type,new Date().toISOString()); }
export function saveRecord(type,input,actor) {
  const data=validateRecord(type,input);
  if(data.officeId&&!getRecord(data.officeId,'offices')) throw new Error('Escritório não encontrado.');
  if(data.diagnosticId) { const d=getRecord(data.diagnosticId,'diagnostics'); if(!d||d.officeId!==data.officeId) throw new Error('Diagnóstico não pertence ao escritório.'); }
  if(data.opportunityId) {const op=getRecord(data.opportunityId,'opportunities'); if(!op||op.officeId!==data.officeId) throw new Error('Oportunidade não pertence ao escritório.');}
  const id=input.id||randomUUID();
  const previous=input.id?getRecord(id,type):null;
  if(input.id&&!previous) throw new Error('Registro não encontrado.');
  if(previous&&input.updatedAt!==previous.updatedAt) throw new Error('Este registro foi alterado em outra sessão. Atualize a página antes de salvar.');
  if(previous?.officeId&&previous.officeId!==data.officeId) {
    const children=type==='diagnostics'?listRecords('opportunities').filter(o=>o.diagnosticId===id):type==='opportunities'?[...listRecords('proposals'),...listRecords('xmlBatches')].filter(p=>p.opportunityId===id):[];
    if(children.length)throw new Error('Existem registros vinculados. Remova os vínculos antes de trocar o escritório.');
  }
  const now=new Date(Math.max(Date.now(),previous?Date.parse(previous.updatedAt)+1:0)).toISOString();
  db().prepare('INSERT INTO records VALUES (?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data,updated_at=excluded.updated_at').run(id,type,JSON.stringify(data),previous?.createdAt||now,now);
  audit(actor,previous?'update':'create',id,type);
  return getRecord(id,type);
}
export function deleteRecord(type,id,actor) {
  if(!getRecord(id,type)) throw new Error('Registro não encontrado.');
  const dependencies= type==='offices' ? ['diagnostics','opportunities','proposals','xmlBatches'] : type==='opportunities' ? ['proposals','xmlBatches'] : type==='diagnostics'?['opportunities']:[];
  const key=type==='offices'?'officeId':type==='opportunities'?'opportunityId':'diagnosticId';
  if(dependencies.some(t=>listRecords(t).some(r=>r[key]===id))) throw new Error('Existem registros vinculados. Remova os vínculos antes de excluir.');
  db().prepare('DELETE FROM records WHERE id=? AND type=?').run(id,type); audit(actor,'delete',id,type);
}
export function workspace() {return {offices:listRecords('offices'),diagnostics:listRecords('diagnostics'),opportunities:listRecords('opportunities'),proposals:listRecords('proposals'),audit:db().prepare('SELECT actor,action,entity_id AS entityId,entity_type AS entityType,created_at AS createdAt FROM audit ORDER BY created_at DESC LIMIT 50').all()};}

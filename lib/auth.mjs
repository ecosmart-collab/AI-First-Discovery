import { scryptSync, randomBytes, timingSafeEqual, createHash } from 'node:crypto';
import { db, audit } from './db.mjs';
export function hashPassword(password) {const salt=randomBytes(16).toString('hex');return `${salt}:${scryptSync(password,salt,64).toString('hex')}`;}
export function verifyPassword(password,stored) {
  if(typeof password!=='string'||password.length>256||!stored) return false;
  const [salt,hex]=stored.split(':'); if(!salt||!hex||hex.length!==128) return false;
  const expected=Buffer.from(hex,'hex'),actual=scryptSync(password,salt,64); return expected.length===actual.length&&timingSafeEqual(expected,actual);
}
const digest=s=>createHash('sha256').update(s).digest('hex');
export function login(email,password) {
  const normalized=String(email).trim().toLowerCase(), key=digest(normalized), now=Date.now();
  db().prepare('DELETE FROM attempts WHERE expires_at<?').run(now);
  const attempt=db().prepare('SELECT * FROM attempts WHERE key=?').get(key);
  if(attempt?.count>=8) throw new Error('Muitas tentativas. Aguarde 15 minutos para tentar novamente.');
  db().prepare('INSERT INTO attempts VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1').run(key,now+15*60*1000);
  const valid=verifyPassword(password,process.env.ADMIN_PASSWORD_HASH);
  if(!valid||normalized!==process.env.ADMIN_EMAIL?.toLowerCase()) {audit('anonymous','login_failed');throw new Error('E-mail ou senha incorretos.');}
  db().prepare('DELETE FROM attempts WHERE key=?').run(key);
  db().prepare('DELETE FROM sessions WHERE expires_at<?').run(now);
  const token=randomBytes(32).toString('hex');db().prepare('INSERT INTO sessions VALUES (?,?,?)').run(digest(token),normalized,now+8*60*60*1000);
  audit(normalized,'login');return {token,email:normalized};
}
export function getSession(token) {if(!token||token.length!==64)return null;return db().prepare('SELECT email FROM sessions WHERE token_hash=? AND expires_at>?').get(digest(token),Date.now())||null;}
export function logout(token) {if(token)db().prepare('DELETE FROM sessions WHERE token_hash=?').run(digest(token));}
export function sameOrigin(request) {
  const origin=request.headers.get('origin'),url=new URL(request.url);
  const expected=process.env.APP_ORIGIN||`${url.protocol}//${request.headers.get('host')||url.host}`;
  return Boolean(origin&&origin===expected);
}

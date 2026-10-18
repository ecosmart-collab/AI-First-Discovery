import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { writeFileSync, existsSync } from 'node:fs';
import { hashPassword } from '../lib/auth.mjs';
if(existsSync('.env.local')) { console.error('.env.local já existe. Faça uma cópia segura e remova-o antes de reconfigurar.');process.exit(1); }
const emailPrompt=createInterface({input:process.stdin,output:process.stdout});
const email=(await emailPrompt.question('E-mail do proprietário: ')).trim().toLowerCase();emailPrompt.close();
if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('E-mail inválido.');
process.stdout.write('Senha (mínimo 12 caracteres, entrada oculta): ');
const silent=new Writable({write(_c,_e,cb){cb();}});
const passwordPrompt=createInterface({input:process.stdin,output:silent,terminal:true});
const password=await passwordPrompt.question('');passwordPrompt.close();process.stdout.write('\n');
if(password.length<12||password.length>256)throw new Error('A senha deve ter entre 12 e 256 caracteres.');
writeFileSync('.env.local',`ADMIN_EMAIL=${email}\nADMIN_PASSWORD_HASH=${hashPassword(password)}\nDATA_DIR=./data\nCOOKIE_SECURE=false\n`,{mode:0o600,flag:'wx'});
console.log('Acesso configurado. Execute npm run dev para uso local. Em produção, use HTTPS e COOKIE_SECURE=true.');

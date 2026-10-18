import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { existsSync, writeFileSync } from 'node:fs';
import { randomBytes, scryptSync } from 'node:crypto';

if (existsSync('.env.production')) throw new Error('.env.production já existe. Preserve-o; não é necessário repetir o setup para atualizar a aplicação.');
if (!process.stdin.isTTY) throw new Error('Execute em um terminal interativo. No Docker, use -it.');
let muted=false;
const output=new Writable({write(chunk,_encoding,done){if(!muted)process.stdout.write(chunk);done();}});
const prompt=createInterface({input:process.stdin,output,terminal:true});
try {
  const domain=(await prompt.question('Domínio da plataforma (ex.: discovery.suaempresa.com.br): ')).trim().toLowerCase();
  const validLabel=/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
  if (domain.length>253||domain.split('.').length<2||!domain.split('.').every(label=>validLabel.test(label))||!/[a-z]/.test(domain.split('.').at(-1))) throw new Error('Informe um domínio DNS válido, sem https://, porta ou caminho.');
  const email=(await prompt.question('E-mail do proprietário (também usado para o certificado): ')).trim().toLowerCase();
  if (!/^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/.test(email)) throw new Error('E-mail inválido.');
  muted=true;
  process.stdout.write('Senha do proprietário (12 a 256 caracteres; entrada oculta): ');
  const password=await prompt.question('');process.stdout.write('\n');
  if (password.length<12||password.length>256) throw new Error('A senha deve ter entre 12 e 256 caracteres.');
  process.stdout.write('Confirme a senha (entrada oculta): ');
  const confirmation=await prompt.question('');process.stdout.write('\n');
  if(password!==confirmation)throw new Error('As senhas não coincidem. Nenhum arquivo foi criado.');
  const salt=randomBytes(16).toString('hex');
  const hash=`${salt}:${scryptSync(password,salt,64).toString('hex')}`;
  writeFileSync('.env.production',`DOMAIN=${domain}\nACME_EMAIL=${email}\nADMIN_EMAIL=${email}\nADMIN_PASSWORD_HASH=${hash}\n`,{mode:0o600,flag:'wx'});
  console.log('Configuração criada em .env.production. A senha não foi armazenada em texto puro.');
} finally {prompt.close();}

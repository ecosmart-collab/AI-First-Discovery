import {readFileSync,appendFileSync,chmodSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
const file='.env.production';
let content;
try{content=readFileSync(file,'utf8');}catch{throw new Error('Configure o proprietário primeiro com scripts/setup-vps.mjs.');}
const existing=content.match(/^XML_SERVICE_TOKEN=(.*)$/m);
if(existing){if(existing[1].trim().length<32)throw new Error('O segredo existente é inválido; corrija a configuração antes de publicar.');console.log('O segredo interno já está configurado. Nenhuma alteração.');}
else{appendFileSync(file,(content.endsWith('\n')?'':'\n')+'XML_SERVICE_TOKEN='+randomBytes(32).toString('hex')+'\n');chmodSync(file,0o600);console.log('Segredo interno do piloto adicionado. Nenhuma senha foi alterada.');}

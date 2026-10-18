import { cookies } from 'next/headers';
import { getSession, sameOrigin } from '../../../../lib/auth.mjs';
import { analyzeXmlUpload, readLimitedJSON } from '../../../../lib/xml.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
let running=false;
export async function POST(request){
  const session=getSession((await cookies()).get('discovery_session')?.value);
  if(!session)return Response.json({error:'Acesso restrito.'},{status:401});
  if(!sameOrigin(request))return Response.json({error:'Origem inválida.'},{status:403});
  if(running)return Response.json({error:'Já existe uma análise em execução. Aguarde e tente novamente.'},{status:429});
  running=true;
  try{return Response.json({batch:await analyzeXmlUpload(await readLimitedJSON(request),session.email)});}
  catch(error){return Response.json({error:error.status?error.message:'Não foi possível concluir a análise.'},{status:error.status||500});}
  finally{running=false;}
}

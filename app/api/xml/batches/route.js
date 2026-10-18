import { cookies } from 'next/headers';
import { getSession, sameOrigin } from '../../../../lib/auth.mjs';
import { getRecord } from '../../../../lib/db.mjs';
import { deleteXmlBatch, reviewXmlBatch, xmlBatches, readLimitedJSON } from '../../../../lib/xml.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
async function user(){return getSession((await cookies()).get('discovery_session')?.value);}
export async function GET(request){
  if(!await user())return Response.json({error:'Acesso restrito.'},{status:401});
  const q=new URL(request.url).searchParams,id=q.get('id');
  if(id){const batch=getRecord(id,'xmlBatches');return batch?Response.json({batch}):Response.json({error:'Lote não encontrado.'},{status:404});}
  return Response.json({batches:xmlBatches(q.get('officeId')||''),configured:Boolean(process.env.XML_SERVICE_URL&&process.env.XML_SERVICE_TOKEN?.length>=32)});
}
export async function PATCH(request){
  const session=await user();if(!session)return Response.json({error:'Acesso restrito.'},{status:401});
  if(!sameOrigin(request))return Response.json({error:'Origem inválida.'},{status:403});
  try{return Response.json({batch:reviewXmlBatch(await readLimitedJSON(request,50000),session.email)});}catch(error){return Response.json({error:error.status?error.message:'Não foi possível salvar a revisão.'},{status:error.status||500});}
}
export async function DELETE(request){
  const session=await user();if(!session)return Response.json({error:'Acesso restrito.'},{status:401});
  if(!sameOrigin(request))return Response.json({error:'Origem inválida.'},{status:403});
  try{const {id}=await readLimitedJSON(request,2000);if(typeof id!=='string')return Response.json({error:'ID inválido.'},{status:400});deleteXmlBatch(id,session.email);return Response.json({ok:true});}catch(error){return Response.json({error:error.status?error.message:'Não foi possível excluir.'},{status:error.status||500});}
}

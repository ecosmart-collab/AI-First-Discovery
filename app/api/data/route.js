import { cookies } from 'next/headers';
import { getSession, sameOrigin } from '../../../lib/auth.mjs';
import { workspace, saveRecord, deleteRecord } from '../../../lib/db.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
async function user(){return getSession((await cookies()).get('discovery_session')?.value);}
export async function GET(){if(!await user())return Response.json({error:'Acesso restrito.'},{status:401});return Response.json(workspace());}
export async function POST(request){
  const session=await user();if(!session)return Response.json({error:'Acesso restrito.'},{status:401});
  if(!sameOrigin(request))return Response.json({error:'Origem inválida.'},{status:403});
  if(Number(request.headers.get('content-length')||0)>150000)return Response.json({error:'Registro muito grande.'},{status:413});
  try {const {type,record}=await request.json();if(!['offices','diagnostics','opportunities','proposals'].includes(type))throw new Error('Tipo inválido.');return Response.json({record:saveRecord(type,record,session.email)});}
  catch(error){return Response.json({error:error.message||'Não foi possível salvar.'},{status:400});}
}
export async function DELETE(request){
  const session=await user();if(!session)return Response.json({error:'Acesso restrito.'},{status:401});
  if(!sameOrigin(request))return Response.json({error:'Origem inválida.'},{status:403});
  try{const {type,id}=await request.json();if(!['offices','diagnostics','opportunities','proposals'].includes(type))throw new Error('Tipo inválido.');deleteRecord(type,id,session.email);return Response.json({ok:true});}catch(error){return Response.json({error:error.message},{status:400});}
}

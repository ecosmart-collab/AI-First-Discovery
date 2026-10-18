import { cookies } from 'next/headers';
import { login, getSession, logout, sameOrigin } from '../../../lib/auth.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const options=()=>({httpOnly:true,sameSite:'strict',secure:process.env.COOKIE_SECURE!=='false',path:'/',maxAge:8*60*60});
export async function GET() {
  const session=getSession((await cookies()).get('discovery_session')?.value);
  return Response.json({user:session,configured:Boolean(process.env.ADMIN_EMAIL&&process.env.ADMIN_PASSWORD_HASH)});
}
export async function POST(request) {
  if(!sameOrigin(request))return Response.json({error:'Origem inválida.'},{status:403});
  if(!process.env.ADMIN_EMAIL||!process.env.ADMIN_PASSWORD_HASH)return Response.json({error:'Configure o acesso com npm run setup no servidor.'},{status:503});
  try {const {email,password}=await request.json();const result=login(email,password);(await cookies()).set('discovery_session',result.token,options());return Response.json({user:{email:result.email}});}
  catch(error){return Response.json({error:error.message||'Não foi possível entrar.'},{status:401});}
}
export async function DELETE(request) {
  if(!sameOrigin(request))return Response.json({error:'Origem inválida.'},{status:403});
  const jar=await cookies();logout(jar.get('discovery_session')?.value);jar.set('discovery_session','',{...options(),maxAge:0});return Response.json({ok:true});
}

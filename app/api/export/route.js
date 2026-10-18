import { cookies } from 'next/headers';
import { getSession } from '../../../lib/auth.mjs';
import { workspace, audit } from '../../../lib/db.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(){const session=getSession((await cookies()).get('discovery_session')?.value);if(!session)return Response.json({error:'Acesso restrito.'},{status:401});audit(session.email,'export');return new Response(JSON.stringify({version:1,exportedAt:new Date().toISOString(),...workspace()},null,2),{headers:{'Content-Type':'application/json; charset=utf-8','Content-Disposition':'attachment; filename="ai-first-discovery-backup.json"','Cache-Control':'no-store'}});}

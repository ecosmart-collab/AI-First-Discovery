import {generateProposal} from './domain.mjs';
export async function loadSample(save) {
  const offices=[];
  for (const item of [
    {name:'Horizonte Contabilidade · Exemplo',contact:'Marina Costa (fictícia)',clients:180,team:18,systems:'Domínio, Excel, WhatsApp',regimes:'Simples Nacional e Lucro Presumido'},
    {name:'Nexo Assessoria · Exemplo',contact:'Rafael Lima (fictício)',clients:95,team:11,systems:'Alterdata, Google Sheets',regimes:'Simples Nacional'},
    {name:'Ápice Contábil · Exemplo',contact:'Clara Alves (fictícia)',clients:260,team:24,systems:'Contmatic, Excel',regimes:'Lucro Presumido e Lucro Real'}
  ]) offices.push(await save('offices',{...item,notes:'DADOS SINTÉTICOS. Exemplo para exploração da plataforma.'}));
  const diagnostics=[];
  for (let i=0;i<3;i++)diagnostics.push(await save('diagnostics',{officeId:offices[i].id,title:['Descoberta operacional','Rotina de fechamento','Mapeamento de atendimento'][i],interviewee:offices[i].contact,status:i===1?'Concluído':'Em andamento',context:'Exemplo fictício para conhecer o fluxo D.E.S.C.O.B.R.E.',pain:'Retrabalho em rotinas manuais',date:new Date().toISOString().slice(0,10)}));
  const specs=[
    ['Pendências documentais sem acompanhamento','Gestão de clientes','U41',0,4,3,3,5,4,1,350,8,55,'Cliente envia o documento, mas ninguém sabe que chegou.'],
    ['Conciliação manual entre planilhas','Contábil','U09',1,5,5,4,4,4,2,800,6,65,'Todo fechamento repetimos a mesma conferência.'],
    ['Triagem de XMLs antes da importação','Fiscal','U02',2,5,4,4,5,5,1,1800,3,60,'Abrimos cada arquivo antes de importar.'],
    ['Solicitações dispersas no WhatsApp','Atendimento','U26',0,5,4,3,4,5,1,600,5,50,'A solicitação fica perdida no grupo.'],
    ['Admissões com informações incompletas','Departamento pessoal','U17',1,3,4,3,5,4,0,80,18,60,'Precisamos pedir a mesma informação mais de uma vez.'],
    ['Fechamento dependente de uma pessoa','Contábil','U15',2,4,5,4,4,5,1,120,15,70,'Sem a pessoa responsável, a equipe perde o histórico.']
  ];
  const ops=[];
  for(const [title,area,catalogId,i,f,im,p,v,r,e,volume,minutes,hourlyCost,quote] of specs)ops.push(await save('opportunities',{officeId:offices[i].id,diagnosticId:diagnostics[i].id,title,area,catalogId,process:title,quote,volume,minutes,hourlyCost,people:2,evidence:e,status:e===2?'Em validação':'Hipótese',ratings:{frequency:f,impact:im,payment:p,feasibility:v,reuse:r},gates:{authorization:e===2,legal:true,owner:true,measurement:e===2},owner:offices[i].contact,kpi:'Tempo médio por ocorrência, taxa de retrabalho e falsos alertas.',simpleSolution:'Checklist, validações por regras e fila centralizada.',cause:'Hipótese: ausência de protocolo e visibilidade do fluxo.',experiment:'Medir o processo por duas semanas com amostra anonimizada.'}));
  await save('proposals',{officeId:offices[1].id,opportunityId:ops[1].id,title:'Piloto de conciliação por regras',status:'Rascunho',setup:4500,monthly:1200,duration:30,issuedAt:new Date().toISOString(),body:generateProposal({office:offices[1],opportunity:ops[1],setup:4500,monthly:1200,duration:30})});
}

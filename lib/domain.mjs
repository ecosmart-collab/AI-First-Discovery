export const WEIGHTS = { frequency: .20, impact: .25, payment: .20, feasibility: .20, reuse: .15 };
export const EVIDENCE = ['Relato genérico', 'Exemplo concreto', 'Dados medidos', 'Piloto comprovado'];
export const GATES = { authorization: 'Autorização de dados', legal: 'Risco jurídico mitigado', owner: 'Dono do processo definido', measurement: 'Resultado mensurável' };
export function score(ratings) {
  return Math.round(Object.entries(WEIGHTS).reduce((s, [k,w]) => {
    const n = Number(ratings[k]);
    if (!Number.isInteger(n) || n < 1 || n > 5) throw new Error('As notas devem ser inteiras entre 1 e 5.');
    return s + n * w;
  }, 0) * 20);
}
export function readiness(gates) { return Object.keys(GATES).every(k => gates?.[k] === true); }
export function economics(op) {
  const hours = Number(op.volume || 0) * Number(op.minutes || 0) / 60;
  const cost = hours * Number(op.hourlyCost || 0);
  const hasAfter = op.afterMinutes !== '' && op.afterMinutes != null;
  const saved = hasAfter ? hours - Number(op.volume || 0) * Number(op.afterMinutes) / 60 : null;
  const benefit = saved == null ? null : saved * Number(op.hourlyCost || 0) + Number(op.avoidedLosses || 0) - Number(op.additionalCosts || 0);
  const solution = Number(op.solutionCost || 0);
  return { hours, cost, saved, benefit, roi: benefit != null && solution > 0 ? (benefit - solution) / solution : null };
}
export const currency = n => new Intl.NumberFormat('pt-BR', {style:'currency', currency:'BRL', maximumFractionDigits:0}).format(n);
export function generateProposal({office, opportunity:op, setup = 0, monthly = 0, duration = 30}) {
  const e = economics(op);
  const blocked = Object.entries(GATES).filter(([key])=>!op.gates[key]).map(([,label])=>label);
  return `PROPOSTA DE PILOTO · ${office.name}\n\n1. Contexto e objetivo\n${op.title}\n${op.quote ? `Relato do cliente: “${op.quote}”` : 'Relato do cliente ainda não registrado.'}\nEvidência: ${EVIDENCE[op.evidence]}. Score de priorização: ${score(op.ratings)}/100. O score não comprova a hipótese.\n\n2. Escopo\nProcesso: ${op.process || op.area}.\nCausa a investigar: ${op.cause || 'A confirmar durante o diagnóstico'}.\nAbordagem inicial: ${op.simpleSolution || 'Mapear o fluxo e avaliar uma solução determinística'}.\nAplicação assistida de IA: ${op.aiSolution || 'Não definida; avaliar somente se necessária'}.\n\n3. Baseline e medição\nVolume informado: ${op.volume} ocorrências/mês; ${op.minutes} minutos/ocorrência.\nCusto atual estimado: ${currency(e.cost)}/mês (${e.hours.toFixed(1)} h). Estes números são estimativas até medição.\nMedir por pelo menos 2 semanas ou amostra equivalente, nas mesmas condições.\nKPI e aceite: ${op.kpi || 'Definir indicador, meta e amostra com o responsável antes do início'}.\nResponsável: ${op.owner || 'A definir'}.\n\n4. Plano do piloto · ${duration} dias\nEtapa 1: validar acesso, fluxo e baseline.\nEtapa 2: configurar solução em ambiente de teste com dados sintéticos ou anonimizados.\nEtapa 3: executar com supervisão humana, medir falsos alertas e registrar custos.\nEtapa 4: comparar resultados, validar aceite e decidir continuidade.\n\n5. Investimento sugerido para revisão\nImplantação do piloto: ${currency(setup)}.\nOperação e evolução: ${currency(monthly)}/mês, mediante contratação específica.\nValidade comercial: 15 dias a partir da emissão. Condições e impostos a acordar.\n\n6. Condições para início\n${blocked.length ? 'Pendências: ' + blocked.join('; ') + '. Não implantar até resolver.' : 'Gates de prontidão preenchidos; confirmar os registros de autorização antes do início.'}\nDefinir finalidade, base legal, acesso mínimo, retenção, descarte, reversão e limites de responsabilidade em contrato. Ações externas e conclusões fiscais críticas exigem aprovação humana.\n\n7. Limites e próximos passos\nO piloto não substitui ERP, julgamento profissional ou parecer fiscal. Horas liberadas não representam automaticamente economia de caixa. Não há promessa de ROI. Confirmar escopo, investimento, responsável e critérios de aceite antes de contratar.`;
}
const trim = (v, limit=10000) => typeof v === 'string' ? v.trim().slice(0,limit) : '';
export function validateRecord(type, input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Registro inválido.');
  const data = {};
  const required = type==='offices' ? ['name'] : type==='diagnostics' ? ['officeId','title'] : type==='opportunities' ? ['officeId','title','area'] : type==='proposals' ? ['officeId','opportunityId','title','body'] : [];
  if (!required.length) throw new Error('Tipo de registro inválido.');
  const fields = {
    offices: ['name','contact','email','phone','systems','regimes','seasonality','notes'],
    diagnostics: ['officeId','title','interviewee','role','date','context','pain','flow','cost','cause','solution','pilot','experiment','nextMeeting','status'],
    opportunities: ['officeId','diagnosticId','title','area','catalogId','process','quote','episode','symptom','flow','cause','consequences','systems','privacy','simpleSolution','aiSolution','kpi','owner','decisionMaker','budget','deadline','experiment','status'],
    proposals: ['officeId','opportunityId','title','body','status','issuedAt']
  };
  for (const key of fields[type]) data[key] = trim(input[key],key==='body'?40000:10000);
  for (const key of required) if (!data[key]) throw new Error(`Campo obrigatório: ${{name:'nome',title:'título',officeId:'escritório',opportunityId:'oportunidade',area:'área',body:'texto da proposta'}[key]||key}.`);
  const numeric = type==='offices' ? ['clients','team'] : type==='opportunities' ? ['volume','minutes','people','hourlyCost','avoidedLosses','additionalCosts','solutionCost'] : type==='proposals' ? ['setup','monthly','duration'] : [];
  for (const key of numeric) { const n = Number(input[key] || 0); if (!Number.isFinite(n) || n<0 || n>1e9) throw new Error(`Valor inválido: ${key}.`); data[key]=n; }
  if (type==='opportunities') {
    data.ratings=Object.fromEntries(Object.keys(WEIGHTS).map(k=>[k,Number(input.ratings?.[k])])); score(data.ratings);
    data.gates=Object.fromEntries(Object.keys(GATES).map(k=>[k,input.gates?.[k]===true]));
    data.evidence=Number(input.evidence??0);
    if (!Number.isInteger(data.evidence) || data.evidence<0 || data.evidence>3) throw new Error('Evidência inválida.');
    data.afterMinutes=input.afterMinutes===''||input.afterMinutes==null ? '' : Number(input.afterMinutes);
    if (data.afterMinutes!=='' && (!Number.isFinite(data.afterMinutes)||data.afterMinutes<0||data.afterMinutes>1e9)) throw new Error('Tempo posterior inválido.');
    if (['Em piloto','Validada'].includes(data.status) && (!readiness(data.gates)||data.evidence<2||!data.kpi||!data.owner)) throw new Error('Piloto exige gates atendidos, dados medidos, responsável e KPI.');
    if(data.status==='Validada'&&data.evidence<3)throw new Error('Oportunidade validada exige evidência de piloto comprovado.');
  }
  const statuses={diagnostics:['Rascunho','Em andamento','Concluído'],opportunities:['Hipótese','Em validação','Em piloto','Validada','Descartada'],proposals:['Rascunho','Em revisão','Aprovada','Recusada']};
  if(statuses[type]&&!statuses[type].includes(data.status)) throw new Error('Status inválido.');
  return data;
}

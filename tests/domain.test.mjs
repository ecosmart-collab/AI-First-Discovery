import test from 'node:test';
import assert from 'node:assert/strict';
import {score,economics,readiness,validateRecord,generateProposal} from '../lib/domain.mjs';
import {CATALOG} from '../lib/catalog.mjs';
const ratings={frequency:5,impact:4,payment:3,feasibility:2,reuse:1};
const gates={authorization:true,legal:true,owner:true,measurement:true};
const opportunity={officeId:'office',title:'Conciliação',area:'Contábil',ratings,gates,evidence:2,status:'Hipótese',volume:600,minutes:6,hourlyCost:50,owner:'Ana',kpi:'Tempo médio'};
test('score aplica os cinco pesos do método e respeita a faixa efetiva',()=>{
  assert.equal(score(ratings),63);
  assert.equal(score(Object.fromEntries(Object.keys(ratings).map(k=>[k,1]))),20);
  assert.equal(score(Object.fromEntries(Object.keys(ratings).map(k=>[k,5]))),100);
  for(const invalid of [0,6,NaN,2.5])assert.throws(()=>score({...ratings,impact:invalid}));
});
test('custo, benefício e ROI usam períodos equivalentes e não presumem resultado posterior',()=>{
  assert.deepEqual(economics(opportunity),{hours:60,cost:3000,saved:null,benefit:null,roi:null});
  assert.deepEqual(economics({...opportunity,afterMinutes:2,avoidedLosses:500,additionalCosts:200,solutionCost:1000}),{hours:60,cost:3000,saved:40,benefit:2300,roi:1.3});
  assert.equal(economics({...opportunity,afterMinutes:12,solutionCost:1000}).roi,-4);
  assert.equal(economics({...opportunity,afterMinutes:0}).saved,60);
});
test('todos os gates são eliminatórios e independentes do score',()=>{
  assert.equal(readiness(gates),true);
  for(const key of Object.keys(gates))assert.equal(readiness({...gates,[key]:false}),false);
  assert.equal(readiness({}),false);
});
test('backend bloqueia piloto sem medição, dono, KPI ou autorização',()=>{
  assert.equal(validateRecord('opportunities',{...opportunity,status:'Em piloto'}).status,'Em piloto');
  for(const patch of [{evidence:1},{owner:''},{kpi:''},{gates:{...gates,authorization:false}}])assert.throws(()=>validateRecord('opportunities',{...opportunity,...patch,status:'Em piloto'}),/Piloto exige/);
  assert.throws(()=>validateRecord('opportunities',{...opportunity,volume:-1}));
  assert.throws(()=>validateRecord('opportunities',{...opportunity,evidence:4}));
  assert.throws(()=>validateRecord('opportunities',{...opportunity,status:'injetado'}));
  assert.throws(()=>validateRecord('opportunities',{...opportunity,status:'Validada'}),/piloto comprovado/);
});
test('catálogo preserva as 64 hipóteses, sem repetição',()=>{assert.equal(CATALOG.length,64);assert.equal(new Set(CATALOG.map(c=>c.id)).size,64);assert.equal(CATALOG[0].id,'U01');assert.equal(CATALOG.at(-1).id,'U64');assert.equal(new Set(CATALOG.map(c=>c.area)).size,8);});
test('proposta personalizada declara evidências, valores e bloqueios sem prometer ROI',()=>{
  const body=generateProposal({office:{name:'Escritório Alfa'},opportunity:{...opportunity,gates:{...gates,authorization:false}},setup:4500,monthly:1200,duration:30});
  for(const fragment of ['Escritório Alfa','Conciliação','63/100','Pendências: Autorização de dados','2 semanas','Não há promessa de ROI','4.500','1.200'])assert.ok(body.includes(fragment),fragment);
});

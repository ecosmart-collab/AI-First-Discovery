# MÉTODO D.E.S.C.O.B.R.E. — AI First Contábil

**Versão:** 1.0 · **Data:** 18/10/2026  
**Uso:** entrevistas exploratórias e diagnóstico operacional para boutique B2B AI First.  
**Nota:** metodologia proposta, ainda não validada empiricamente. Urgências listadas são hipóteses, não constatações.

## 1. Tese de negócio

Atender poucos escritórios contábeis com implantação personalizada e contrato mensal de operação/evolução. Não substituir ERPs ou o julgamento profissional do contador; melhorar processos verificáveis com regras, integrações e IA supervisionada.

## 2. Método D.E.S.C.O.B.R.E.

| Letra | Fase | Evidência / entrega |
|---|---|---|
| D | Diagnosticar a operação | Perfil, equipe, sistemas, volumes, sazonalidade |
| E | Escutar dores declaradas | Citações literais e exemplos recentes |
| S | Seguir a execução | Etapas, telas, planilhas, passagens de bastão |
| C | Calcular custo e risco | Volume × tempo × custo/hora; erros e atrasos |
| O | Organizar causas | Causa-raiz, não apenas sintomas |
| B | Buscar soluções | Integração, regra, RPA, IA ou mudança de processo |
| R | Recomendar piloto | Uma oportunidade com escopo, indicador e responsável |
| E | Experimentar e medir | Baseline, piloto assistido, precisão, ROI observado |

## 3. Princípios de entrevista

- **Não vender ferramenta na primeira conversa.** Pedir exemplos observáveis.
- **Perguntar pelo último caso real** em vez de aceitar apenas opiniões genéricas.
- **Separar sintoma, causa, consequência, responsável e hipótese de solução.**
- **Não pressupor IA:** formulários melhores e integrações simples podem ter melhor custo-benefício.
- **Confirmar a autorização** antes de visualizar arquivos, dados de clientes ou sistemas internos.
- **Não usar dados fiscais reais em demonstrações externas** sem base adequada, contrato e proteções.

## 4. Roteiro de reunião — 55 minutos

**0–5 min — Contexto**
> Estamos mapeando processos operacionais de escritórios contábeis para identificar onde tecnologia e IA podem reduzir retrabalho. Não precisamos ver dados confidenciais nesta primeira conversa. Você pode descrever um processo que mais incomoda sua equipe?

**5–15 min — Perfil**
- Quantas empresas atendem? Em quais regimes e setores, aproximadamente?
- Quantas pessoas atuam no fiscal, contábil, DP e atendimento?
- Quais ERPs, planilhas, portais e canais de comunicação utilizam?
- Quais semanas do mês são mais críticas?

**15–30 min — Descoberta**
- Se pudesse eliminar um único problema operacional nos próximos 90 dias, qual seria?
- Qual tarefa repetitiva consome mais tempo?
- Onde a equipe copia dados entre ferramentas?
- Qual solicitação de cliente volta para correção com frequência?
- Que erros só são descobertos perto do prazo?
- Que processo depende demais de uma pessoa?

**30–45 min — Aprofundar UM problema**
- Quando foi o último episódio? Pode descrever o caminho completo?
- Quem executou e quanto tempo gastou?
- Qual o volume semanal/mensal? Como medem?
- Houve perda, atraso, retrabalho ou reclamação? Há registro?
- O que vocês já tentaram? Por que não funcionou?
- Quem aprovaria uma mudança e qual orçamento faria sentido?

**45–55 min — Fechamento**
- Recapitular problema em palavras do cliente e solicitar correção.
- Propor medição simples do processo por 2 semanas.
- Combinar acesso somente a exemplos anonimizados e aprovados.
- Definir responsável pela validação e próximo encontro.

## 5. Ficha de urgência oculta (copiar por problema)

**ID:**  
**Escritório / entrevistado / função:**  
**Área / processo:**  
**Fala literal:**  
**Último episódio (data aproximada):**  
**Sintoma declarado:**  
**Fluxo atual (passo a passo):**  
**Causa-raiz hipotética:**  
**Volume por mês:**  
**Minutos por ocorrência:**  
**Pessoas envolvidas:**  
**Custo/hora estimado:**  
**Erros / consequências verificadas:**  
**Ferramentas e integrações disponíveis:**  
**Restrições de privacidade e autorização:**  
**Solução mais simples sem IA:**  
**Possível aplicação de IA:**  
**Critério de aceite / KPI:**  
**Quem decide / orçamento / prazo:**  
**Evidência:** Relato / Demonstrado / Medido / Piloto validado  
**Próximo experimento:**

## 6. Matriz de priorização

Avaliar de 1 (baixo) a 5 (alto):

- F — Frequência do problema (peso 20%)
- I — Impacto econômico, operacional e de risco (25%)
- P — Probabilidade de pagamento / patrocinador interno (20%)
- V — Viabilidade técnica e integração (20%)
- R — Reutilização entre escritórios (15%)

**Score = (0,20×F + 0,25×I + 0,20×P + 0,20×V + 0,15×R) × 20**, de 0 a 100 (faixa efetiva 20–100 com notas 1–5).

**Gates eliminatórios:** sem autorização de dados, risco jurídico não mitigado, ausência de dono do processo ou falta de forma de medir resultado = não implantar ainda. Atribuir nota de *confiança de evidência* à parte: 0 relato genérico, 1 exemplo concreto, 2 dados medidos, 3 piloto comprovado. Não confundir score alto com problema validado.

### Economia do processo

- **Horas atuais/mês** = volume × minutos por ocorrência ÷ 60.
- **Custo mensal estimado** = horas × custo/hora carregado (salário, encargos e overhead).
- **Horas evitadas** = horas anteriores − horas posteriores, medidas nas mesmas condições.
- **Benefício financeiro** = horas evitadas × custo/hora + perdas demonstravelmente evitadas − custos adicionais.
- **ROI do piloto** = (benefício financeiro − custo total da solução) ÷ custo total da solução. Não prometer redução de quadro; horas liberadas não equivalem automaticamente a economia de caixa.

## 7. Mapa de 64 urgências ocultas — hipóteses de entrevista

Cada linha relaciona uma dor observável a uma hipótese de automação. Validar com clientes antes de priorizar.

| ID | Área | Urgência oculta a investigar | Hipótese de solução |
|---|---|---|---|
| U01 | Fiscal | XMLs chegam tarde e empurram conferência para o fim do prazo | Coleta e acompanhamento de documentos |
| U02 | Fiscal | Arquivos XML são conferidos um a um sem triagem | Validações determinísticas em lote |
| U03 | Fiscal | Documentos duplicados passam pela importação | Deduplicação e alerta |
| U04 | Fiscal | Cadastro de produto/serviço diverge da nota | Conciliação cadastral |
| U05 | Fiscal | Incidências fiscais são revisadas apenas após o erro | Fila preventiva de exceções |
| U06 | Fiscal | Consultas fiscais dependem de portais e cópia manual | Integrações autorizadas |
| U07 | Fiscal | Erros de layout bloqueiam processamentos | Pré-validação de esquema |
| U08 | Fiscal | Histórico de correções não vira conhecimento da equipe | Base de ocorrências com revisão |
| U09 | Contábil | Conciliações dependem de exportar e colar planilhas | Conciliação por regras |
| U10 | Contábil | Lançamentos recorrentes são refeitos mensalmente | Modelos e importação controlada |
| U11 | Contábil | Diferenças de saldo só aparecem no fechamento | Detecção de divergência antecipada |
| U12 | Contábil | Documentos não são vinculados ao lançamento | Vinculação documental semiautomática |
| U13 | Contábil | Revisão de lançamentos segue ordem e não risco | Triagem de anomalias |
| U14 | Contábil | Explicações de variações consomem muito tempo | Relatórios com evidências |
| U15 | Contábil | Fechamento depende de memória de um funcionário | Checklist com histórico |
| U16 | Contábil | Meses anteriores são difíceis de comparar | Comparativos automatizados |
| U17 | Departamento pessoal | Admissões chegam com dados faltantes | Checklist e solicitação estruturada |
| U18 | Departamento pessoal | Alterações cadastrais chegam em mensagens dispersas | Formulário e protocolo de alteração |
| U19 | Departamento pessoal | Prazos dependem de planilha de uma pessoa | Agenda e alertas de obrigação |
| U20 | Departamento pessoal | Comprovantes de férias ficam espalhados | Organização documental |
| U21 | Departamento pessoal | Solicitações de rescisão entram sem informações mínimas | Formulário com validação |
| U22 | Departamento pessoal | Eventos retornados com erro exigem triagem manual | Classificação de rejeições |
| U23 | Departamento pessoal | Equipe atende as mesmas dúvidas operacionais | Respostas de rotina revisadas |
| U24 | Departamento pessoal | Ausências de pessoal interrompem rotinas | Documentação de procedimentos |
| U25 | Atendimento | Perguntas repetidas chegam em múltiplos canais | FAQ contextual com revisão |
| U26 | Atendimento | Mensagens importantes se perdem no WhatsApp | Centralização de solicitações |
| U27 | Atendimento | Cliente não sabe quem acompanha sua demanda | Portal de status |
| U28 | Atendimento | Pedidos urgentes não têm classificação consistente | Triagem por prioridade |
| U29 | Atendimento | Resposta depende do funcionário específico | Base de conhecimento interna |
| U30 | Atendimento | Comunicações legais são redigidas do zero | Modelos revisados por responsável |
| U31 | Atendimento | Documentos enviados por mensagem ficam sem protocolo | Registro e anexação segura |
| U32 | Atendimento | Falta histórico de promessa de retorno | Gestão de SLA e lembretes |
| U33 | Gestão operacional | Gestor não enxerga gargalos até estourar o prazo | Painel de filas e tempos |
| U34 | Gestão operacional | Tarefas mudam de responsável sem registro | Workflow e auditoria |
| U35 | Gestão operacional | A mesma informação é digitada várias vezes | Integração e sincronização |
| U36 | Gestão operacional | Prioridades são decididas por mensagens | Fila operacional com critérios |
| U37 | Gestão operacional | Correções se repetem sem análise de causa | Taxonomia de erros |
| U38 | Gestão operacional | Treinamento de novatos depende de acompanhamento informal | Procedimentos guiados |
| U39 | Gestão operacional | Trabalho é distribuído sem visibilidade da capacidade | Painel de carga de trabalho |
| U40 | Gestão operacional | Reuniões gastam tempo levantando status | Resumo automático fundamentado |
| U41 | Gestão de clientes | Cobrança de documentos depende de lembrar | Régua de pendências aprovada |
| U42 | Gestão de clientes | Clientes reincidentes recebem o mesmo tratamento | Segmentação por histórico |
| U43 | Gestão de clientes | Gestor não sabe quais clientes mais demandam suporte | Medição de esforço por cliente |
| U44 | Gestão de clientes | Dados do contato estão desatualizados | Rotina de atualização cadastral |
| U45 | Gestão de clientes | Mudanças de regime não atualizam checklists | Gatilhos por evento revisados |
| U46 | Gestão de clientes | Onboarding de novo cliente começa por troca de e-mails | Fluxo de entrada estruturado |
| U47 | Gestão de clientes | Documentos recebidos não são acusados ao cliente | Confirmação de recebimento |
| U48 | Gestão de clientes | Reclamações não viram melhoria de processo | Análise de feedback |
| U49 | Reforma Tributária | Equipe não sabe qual mudança exige ação imediata | Radar com fonte e vigência |
| U50 | Reforma Tributária | Normas são lidas sem relacionar à carteira | Correspondência por perfil de cliente |
| U51 | Reforma Tributária | Cadastros não estão preparados para novos campos | Auditoria de prontidão cadastral |
| U52 | Reforma Tributária | ERP e processos têm cronogramas diferentes | Mapa de dependências de implementação |
| U53 | Reforma Tributária | Cliente recebe comunicado genérico sobre a reforma | Comunicação segmentada revisada |
| U54 | Reforma Tributária | Versões antigas de regras continuam em planilhas | Versionamento normativo |
| U55 | Reforma Tributária | Testes fiscais não guardam casos e resultados | Suíte de regressão de regras |
| U56 | Reforma Tributária | Gestor não sabe quem validou mudanças críticas | Trilha de aceite técnico/fiscal |
| U57 | Gestão estratégica | Honorários não refletem esforço real por cliente | Custos por cliente e atividade |
| U58 | Gestão estratégica | Rentabilidade da carteira é desconhecida | Painel de margem por contrato |
| U59 | Gestão estratégica | Horas extras são tratadas como inevitáveis | Análise de capacidade |
| U60 | Gestão estratégica | Novas vendas aumentam volume sem previsão de carga | Planejamento de cenários |
| U61 | Gestão estratégica | Gestor não mede resultado das automações | KPIs antes/depois |
| U62 | Gestão estratégica | Equipe tem pouco tempo para consultoria | Automação das tarefas documentadas |
| U63 | Gestão estratégica | Oportunidades consultivas ficam escondidas nos dados | Relatórios gerenciais revisados |
| U64 | Gestão estratégica | Dependência de uma pessoa ameaça continuidade | Matriz de dependência e documentação |

## 8. Hipóteses prioritárias para as cinco primeiras entrevistas

1. **Pendências documentais:** frequentes, mensuráveis e com fluxo claro.
2. **Retrabalho entre sistemas:** confirmar se existem integrações permitidas.
3. **Validação de XMLs:** iniciar com regras de esquema e duplicidade, sem presumir competência tributária automatizada.
4. **Centralização de atendimento:** medir volume, tempo e impacto de perda de contexto.
5. **Prontidão para 2027:** verificar cadastros e calendário com fontes oficiais vigentes.

## 9. Regras de seleção do primeiro piloto

- Uma única dor operacional, um responsável, um fluxo e uma métrica primária.
- Baseline de pelo menos 2 semanas ou amostra documental equivalente.
- Critérios de segurança, autorização e reversão acordados antes de produção.
- Preferir automação determinística para regras verificáveis; IA para classificação, extração e rascunhos assistidos.
- Ações externas e conclusões fiscais críticas exigem aprovação humana.
- Revisar taxa de falsos alertas, custo e tempo de supervisão.

## 10. Saídas comerciais

**Entrega gratuita de conversa inicial:** resumo de três hipóteses (sem parecer fiscal).

**Diagnóstico contratado:** mapa do processo atual, medições, oportunidades priorizadas, estimativa de implementação e limites de responsabilidade.

**Piloto contratado:** escopo fechado, critérios de aceite e relatório de resultados.

**Recorrência:** monitoramento, manutenção e melhorias com limites contratuais, relatórios mensais e SLA.

## 11. Governança e proteção de dados

Definir autorização de acesso, finalidade, papel das partes na LGPD, segregação de clientes, logs, controles de permissão, retenção e descarte. Utilizar dados sintéticos ou anonimizados nos primeiros testes. Se houver tratamento de dados reais, documentar as bases legais pertinentes e os controles contratuais e técnicos; não inserir informações fiscais identificáveis em serviços de IA sem avaliação e salvaguardas adequadas.

## 12. Referências de contexto (verificar atualização)

- CFC, pesquisa IOB/CFC/Fenacon sobre IA na contabilidade (2026): https://cfc.org.br/noticias/pesquisa-mostra-avanco-da-inteligencia-artificial-na-rotina-dos-profissionais-da-contabilidade/
- Receita Federal, orientações e cronogramas da Reforma Tributária: https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/acoes-e-programas/programas-e-atividades/reforma-tributaria-do-consumo/orientacoes-da-reforma-tributaria
- ANPD, guia de segurança para agentes de tratamento de pequeno porte: https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-orientativo-sobre-seguranca-da-informacao-para-agentes-de-tratamento-de-pequeno-porte

**Próxima revisão:** após 5 entrevistas, substituir hipóteses por evidências, atualizar pesos e selecionar um único MVP.

# AI First Discovery

Plataforma privada para conduzir diagnósticos de escritórios contábeis, investigar urgências ocultas, priorizar oportunidades e gerar propostas personalizadas com o método D.E.S.C.O.B.R.E.

## O que está implementado

- Login exclusivo do proprietário, senha com scrypt, sessões de 8 horas em cookie HttpOnly, limitação de tentativas e validação de origem nas mutações.
- Cadastro de escritórios, carteira, equipe, sistemas, contato e sazonalidade.
- Diagnóstico pelas oito fases do método, com notas, entrevistado e próximo encontro.
- Biblioteca pesquisável com as 64 hipóteses do documento fornecido, distribuídas em oito áreas.
- Fichas de urgência com fala literal, último episódio, fluxo, causa, custo, solução sem IA, aplicação de IA, responsável e experimento.
- Score ponderado, evidência independente e quatro gates de prontidão. O servidor bloqueia o status de piloto/validada sem gates atendidos, dados medidos, responsável e KPI.
- Matriz visual de score × evidência e exportação CSV.
- Estimativas de horas/custo e cálculo de benefício e ROI quando há dados posteriores.
- Propostas editáveis, personalizadas pelos registros, valores e duração; exportação Markdown e impressão/PDF pelo navegador.
- SQLite persistente no servidor, exportação JSON e log de auditoria sem conteúdo das entrevistas.
- Dados sintéticos opcionais, disponíveis em workspace vazio, e interface responsiva.
- Piloto de XMLs com nfelib e erpbrasil.base: triagem de NF-e/NFC-e 4.00, duplicidades por escritório, revisão humana, CSV e comparação de tempo manual/assistido. Veja o [roteiro do piloto XML](docs/piloto-xml.md).

As propostas usam composição determinística baseada nos registros. Esta versão não utiliza um modelo de linguagem nem envia dados a provedores de IA. A metodologia foi proposta, mas ainda não foi validada empiricamente; as urgências do catálogo são hipóteses.

## Executar localmente

Requer Node.js 24 LTS ou superior e npm. O SQLite é o módulo nativo `node:sqlite` do Node, sem serviço externo.

O piloto XML usa um serviço Python 3.12 separado. As demais funções da plataforma continuam disponíveis sem esse serviço; sua configuração local está no [roteiro do piloto](docs/piloto-xml.md).

```bash
npm ci
npm run setup
npm run dev
```

O setup solicita e-mail e senha de pelo menos 12 caracteres. A senha não é mostrada e somente seu hash é gravado em `.env.local`, arquivo ignorado pelo Git. Abra `http://localhost:3000` e entre com o acesso configurado. Não existem credenciais padrão ou cadastro público.

Para conhecer os fluxos, entre e use **Explorar com dados de exemplo** na visão geral ou **Configurações → Carregar dados de exemplo**. Os nomes são fictícios e identificados por “Exemplo”. O carregamento é sequencial; se houver falha, os registros já criados permanecem disponíveis e podem ser excluídos individualmente.

## Produção privada

Para uma VPS Linux, use o [roteiro com Docker, Caddy, HTTPS e volume persistente](docs/vps.md). A alternativa abaixo executa o Node diretamente no servidor.

Esta versão foi preparada para um servidor Node com disco persistente. Não use um ambiente serverless com disco efêmero ou múltiplas réplicas independentes. Todo o workspace pertence a um único proprietário; não há convites, múltiplos usuários ou múltiplas organizações.

1. Instale dependências, configure o proprietário e execute `npm run build`.
2. Defina `DATA_DIR` em um volume persistente exclusivo, acessível apenas ao usuário do processo.
3. Defina `COOKIE_SECURE=true` e `APP_ORIGIN=https://seu-dominio` no ambiente de produção. A origem não deve terminar em `/`. `COOKIE_SECURE=false` é somente para desenvolvimento local em HTTP.
4. Execute `npm start` atrás de um proxy reverso com HTTPS. Encaminhe o cabeçalho `Host`, restrinja o acesso direto à porta Node e aplique limite de tamanho de corpo de requisição de 150 KB e limitação de tráfego no proxy.
5. Mantenha o serviço com um supervisor de processos e backups externos protegidos do banco e da configuração do proprietário.

O conteúdo inicial da página não contém registros; todas as APIs de dados e exportação exigem sessão válida. O aplicativo não registra conteúdo das entrevistas no log de auditoria. O arquivo SQLite não possui criptografia própria: proteja o volume, os backups e o acesso ao servidor. A plataforma não implementa descarte automático; defina sua política de retenção e exclua registros na interface, respeitando os vínculos.

Para alterar o proprietário/senha, pare o serviço, faça uma cópia segura de `.env.local`, remova-o, rode o setup, remova as sessões existentes do banco com `DELETE FROM sessions` por uma ferramenta SQLite administrativa e reinicie. Nunca inclua credenciais no Git.

## Backup e restauração

**Configurações → Exportar dados** gera um JSON para portabilidade dos registros e os últimos 50 eventos. Não há importador JSON nesta versão.

Para um backup integral consistente, pare o serviço e copie o diretório completo de `DATA_DIR` (incluindo arquivos WAL/SHM, caso existam) e a configuração de acesso para armazenamento protegido. Para restaurar, mantenha o serviço parado, restaure os arquivos e permissões, remova as sessões antigas, confirme as variáveis e reinicie. Não copie somente o arquivo principal enquanto o serviço estiver gravando.

## Regras do método

```text
Score = (0,20 F + 0,25 I + 0,20 P + 0,20 V + 0,15 R) × 20
Notas: 1 a 5. Faixa efetiva: 20 a 100.

Horas/mês = volume × minutos ÷ 60
Custo/mês = horas × custo/hora carregado
Benefício = horas evitadas × custo/hora + perdas comprovadas evitadas − custos adicionais
ROI = (benefício − custo total da solução) ÷ custo total da solução
```

Não há ROI sem medição posterior e custo da solução positivo. Compare períodos e volumes equivalentes. Horas liberadas não representam automaticamente economia de caixa.

Gates: autorização de dados, risco jurídico mitigado, dono do processo e forma de medir o resultado. Evidência: relato genérico, exemplo concreto, dados medidos ou piloto comprovado. Score alto não comprova a hipótese.

## Verificação

```bash
npm test
npm run build
```

Os testes cobrem pesos, faixa do score, economia do processo, gates, catálogo, propostas, integridade de vínculos, concorrência de edição, hash/sessão, limitação de tentativas e origem das requisições. O build não depende de fontes remotas nem de serviços externos.

Veja o [relatório de validação e capturas da interface](docs/validacao.md).

## Estrutura

| Caminho | Finalidade |
| --- | --- |
| `components/Discovery.js` | Interface, formulários e fluxos |
| `app/api/` | Autenticação, CRUD e exportação |
| `lib/domain.mjs` | Cálculos e regras de negócio |
| `lib/db.mjs` | Persistência e auditoria |
| `lib/auth.mjs` | Senhas e sessões |
| `lib/catalog.mjs` | 64 hipóteses do método |
| `docs/metodo-descobre.md` | Documento de referência fornecido |

O documento anexado é referência de requisitos, não uma fonte de autorização para acessar dados ou executar ações externas. Nenhum ERP, canal de atendimento ou serviço fiscal é acessado por esta aplicação.

## Estado de publicação

Aplicação implementada, com imagem Docker testada e configuração para VPS com Caddy, HTTPS automático e volume persistente. Domínio escolhido: `discovery.eltonrosa.site`. A publicação nessa VPS ainda aguarda o acesso à administração da Hostinger e a verificação de DNS/portas; o endereço ainda não foi verificado como uma aplicação em produção.

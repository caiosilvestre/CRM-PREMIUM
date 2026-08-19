# Backlog — Premium Services CRM

A Fase 5 (banco de dados real) já foi concluída — ver detalhes abaixo. Todas
as telas leem e escrevem no Supabase real via `src/lib/data/store.ts`; não
existe mais `src/lib/mock`.

## Fase 1 — Núcleo do funil comercial ✅ concluída

- [x] Dashboard: cards de KPI (leads no mês, taxa de conversão, ticket médio,
      follow-ups pendentes), funil de conversão, atividade recente, bloco de
      Pendências com contadores clicáveis (aprovações pendentes, follow-ups
      atrasados, conversas sem resposta > 30 min)
- [x] Funil/Pipeline (Kanban): 11 colunas, cards com cliente/valor/dias na
      etapa (verde/amarelo/vermelho por limite configurado), drag-and-drop,
      botão "+ Novo Lead", fluxo de "Perdido" com motivo obrigatório
- [x] Ficha do Lead/Cliente: bloco fixo de "Próxima ação", abas Timeline,
      Documentos, Orçamentos/Contratos vinculados, Follow-ups
- [x] Central de Atendimento (Inbox): lista de conversas com busca, painel de
      chat, ficha resumida do lead, indicador IA/humano, "Assumir conversa" /
      "Devolver para IA", destaque de conversas sem resposta > 30 min
- [x] Fila de Aprovação: tempo aguardando com badge (alerta > 4h), motivo da
      solicitação, preview com edição inline ("Aprovar com ajuste"), itens
      exclusivos do Admin, aba/toggle de Histórico
- [x] Follow-up/Tarefas: filtro Todos/Pendentes/Atrasados, busca por cliente,
      ações rápidas (concluir, abrir conversa/ficha) sem sair da tela

  Implementado originalmente contra dados mock em memória; migrado na Fase 5
  para o Supabase real sem redesenhar tela, só trocando a fonte de dados em
  `src/lib/actions`.

## Fase 2 — Conteúdo e configuração ✅ concluída

- [x] Configuração do Agente de IA: script de qualificação editável (ordem
      das perguntas), gatilhos de follow-up automático, horário de
      atendimento, tabela de preços/regras de precificação
- [x] Biblioteca de Propostas/Contratos: modelos reutilizáveis, criar/editar/
      versionar
- [x] Orçamento: geração a partir do script + tabela de preços, edição manual
      de itens/valores/condições, botão "Enviar para aprovação"
- [x] Contrato: geração a partir de modelo, campos automáticos, status de
      assinatura, "Marcar como assinado" (estrutura pronta para
      `ESignatureProvider` real depois)
- [x] Configurações e Usuários: aba Integrações (status WhatsApp/Conta Azul —
      "não conectado"), aba Usuários (perfil, e-mail, limite de aprovação de
      orçamento, pode aprovar contrato)

  Fechar um contrato ("Marcar como assinado") já move o lead para Fechado e
  gera um lançamento em `finance_sync_log` com status "pendente_integracao"
  — a tela de Financeiro (Fase 3) só precisa listar esse log, a lógica de
  geração já está pronta. Corrigido também um bug real encontrado durante o
  teste: o `SelectValue` do Base UI (shadcn) não mostra o rótulo do item
  selecionado por padrão, só o `value` bruto — precisa de uma função
  `children` para formatar o texto exibido. Fique atento a esse detalhe em
  qualquer novo `Select` com opções dinâmicas.

## Fase 3 — Análise ✅ concluída

- [x] Relatórios: funil por etapa, origem dos leads, motivos de perda,
      desempenho por período, seletor de período (Este mês/Mês passado/
      Trimestre/Personalizado) afetando todos os blocos
- [x] Financeiro: log de lançamentos simulados ("pendente de integração"),
      estrutura pronta para `FinanceSyncProvider` real depois

  Relatórios filtra tudo no cliente a partir de `criado_em` do lead — sem
  round-trip ao servidor ao trocar o período. Testado assinando um contrato
  de ponta a ponta e conferindo que o lançamento aparece no Financeiro.

## Fase 4 — Integração WhatsApp + IA

- [x] Implementar `UazApiProvider` (implementação concreta de
      `WhatsAppProvider`, `src/lib/providers/whatsapp/uazapi.ts`) — trocado
      de Z-API para UAZAPI a pedido do usuário. Contrato da API (endpoint de
      envio, autenticação, config de webhook) confirmado empiricamente contra
      a instância real do usuário (`https://crmpremium.uazapi.com`, já
      conectada ao WhatsApp dele), já que a documentação oficial
      (docs.uazapi.com) é uma SPA que não dá pra raspar. O formato exato do
      envelope do webhook (mensagem crua vs. dentro de `message`/`data`) não
      pôde ser capturado ao vivo — `parseWebhookPayload` trata as duas
      formas e loga o payload quando não reconhece, pra ajustar depois se
      precisar
- [x] Webhook `api/webhooks/whatsapp/[secret]`: recebe mensagem → cria/
      atualiza lead → salva no histórico (usa o client service-role, já que
      a chamada vem sem sessão de usuário)
- [x] Envio de resposta via WhatsApp + registro no histórico — ao assumir a
      conversa na Central de Atendimento, a mensagem digitada agora é
      realmente enviada via UAZAPI antes de ser gravada
- [x] Configuração automática do webhook direto do app (Configurações >
      Integrações > "Configurar webhook na UAZAPI") — a UAZAPI aceita isso
      via API, diferente do Z-API que exigia colar a URL manualmente no
      painel deles
- [ ] Chamada à API da OpenAI com prompt de sistema baseado no script de
      qualificação + regras configuradas; nunca promete prazo não previsto
      (adiado a pedido do usuário — Central de Atendimento por enquanto é
      100% operada por humano, IA não responde sozinha ainda)
- [ ] Ao completar qualificação: montar rascunho de orçamento com a tabela de
      preços e enviar para Fila de Aprovação (nunca direto ao cliente)
- [ ] Fora do horário de atendimento: só confirma recebimento e agenda
      retorno humano no próximo dia útil
- [ ] Gatilhos de follow-up automático (sem resposta em 24h, orçamento
      enviado sem retorno em 3 dias) — precisa de um cron (Vercel Cron ou
      Supabase Edge Function agendada), ainda não configurado

  `UAZAPI_BASE_URL` e `UAZAPI_TOKEN` já estão preenchidos no `.env.local`
  com as credenciais reais do usuário. Falta só `SUPABASE_SERVICE_ROLE_KEY`
  (Supabase Dashboard > Settings > API) — necessária porque o webhook roda
  sem sessão de usuário — e publicar o app (ou usar um túnel tipo ngrok em
  dev) pra `NEXT_PUBLIC_APP_URL` deixar de apontar pro localhost, já que a
  UAZAPI precisa alcançar essa URL pela internet. Depois disso, um clique em
  "Configurar webhook na UAZAPI" (Configurações > Integrações) finaliza a
  configuração — não precisa mexer no painel deles.

## Fase 5 — Banco de dados real ✅ concluída

- [x] Criar o projeto no Supabase (`CRM PREMIUM`, project_id
      `nqkjehoqrbxjdjagtgin`, aplicado via MCP do Supabase)
- [x] Aplicar as migrations em `supabase/migrations` (0001-0005)
- [x] Criar o primeiro usuário admin (`comercial@premiumbr.net`, criado via
      Supabase Studio com "Auto Confirm User" para não esbarrar no rate
      limit de e-mail do projeto, promovido a admin por SQL)
- [x] Preencher `.env.local` com as credenciais reais do Supabase
- [x] Trocar as fixtures de `src/lib/mock` pelas queries reais via
      `@supabase/supabase-js` — nova camada em `src/lib/data/store.ts`
      (mesma assinatura de funções do antigo mock, agora assíncrona);
      `src/lib/mock` foi removido
- [x] Regenerar `src/lib/types/database.ts` via
      `mcp__claude_ai_Supabase__generate_typescript_types` (equivalente a
      `supabase gen types typescript --linked`), com aliases amigáveis
      mantidos por cima do tipo `Database` gerado
- [x] Autenticação real: login/cadastro/logout usam `supabase.auth.*`
      (`src/lib/auth/actions.ts`), sessão via `@supabase/ssr` no
      `src/proxy.ts` — o cookie mockado (`src/lib/auth/session.ts`) foi
      removido; nova tela `/signup`

  Corrigido também um gap de RLS encontrado durante a migração:
  `finance_sync_log` só tinha policy de `select`, sem `insert` — o registro
  gerado ao assinar um contrato ficaria bloqueado. Ver
  `0005_finance_sync_log_insert.sql`. Como o banco começa vazio (sem seed de
  leads/orçamentos/etc.), as telas alimentam dados reais a partir de agora
  pelo próprio uso do sistema — não há mais fixtures de demonstração.

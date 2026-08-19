# Premium Services CRM

CRM comercial da Premium Services — atendimento via WhatsApp com IA, funil de
vendas, orçamentos, contratos e fila de aprovação.

## Stack

- Next.js (App Router) + TypeScript, Tailwind CSS + shadcn/ui
- Supabase (Postgres + Auth), acessado em runtime via `@supabase/supabase-js`
- OpenAI (agente de IA do atendimento) e Z-API (WhatsApp), atrás de interfaces
  em [src/lib/providers](src/lib/providers) para permitir trocar de provedor

## Setup

1. Copie `.env.example` para `.env.local` e preencha as credenciais do
   Supabase, OpenAI e Z-API.
2. Crie um projeto no Supabase e aplique as migrations em
   [supabase/migrations](supabase/migrations), em ordem, via SQL Editor do
   Supabase Studio ou pela CLI (`supabase db push`).
3. Crie sua conta em `/signup` (ou em Authentication > Users no Supabase
   Studio, marcando "Auto Confirm User" para pular a confirmação por
   e-mail) — um `profiles` correspondente é criado automaticamente (ver
   trigger em `0003_seed.sql`). Depois rode o `update` de exemplo no final
   desse arquivo para promover a conta a admin.
4. Rode o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

   Acesse [http://localhost:3000](http://localhost:3000).

## Estrutura

- `src/app/(auth)` — login e cadastro (público)
- `src/app/(app)` — telas protegidas do CRM (sidebar + as 12 seções principais)
- `src/lib/supabase` — clients Supabase (browser, server, middleware de sessão)
- `src/lib/data/store.ts` — camada de acesso a dados (leitura/escrita real no
  Supabase); `src/lib/actions` chama essas funções a partir das server actions
- `src/lib/providers` — interfaces `WhatsAppProvider`, `ESignatureProvider`,
  `FinanceSyncProvider` para as integrações externas
- `src/lib/types/database.ts` — tipos das tabelas, gerados a partir do schema
  real (regenerar com `supabase gen types typescript --linked` ou via MCP do
  Supabase quando o schema mudar)
- `supabase/migrations` — schema, RLS e seed do banco

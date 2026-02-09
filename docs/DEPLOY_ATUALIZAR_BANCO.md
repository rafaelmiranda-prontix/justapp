# Atualizar o banco para o deploy

## Automático no build da Vercel

O **build na Vercel** já roda `prisma migrate deploy` automaticamente: as migrations pendentes são aplicadas antes do `next build`. Você não precisa rodar nada à mão, desde que:

- **DATABASE_URL** esteja configurada nas variáveis de ambiente do projeto na Vercel (Production e Preview, se quiser que previews também usem o banco).
- **Supabase com connection pooler:** se o deploy falhar na etapa de migrations (erro de pool ou “too many connections”), adicione **DIRECT_URL** na Vercel com a URL **direta** do banco (porta 5432, sem pooler) e no `prisma/schema.prisma` no `datasource` adicione `directUrl = env("DIRECT_URL")`. O Prisma usa `directUrl` só para migrations.

Se o migrate automático falhar ou você preferir aplicar à mão, use os passos abaixo.

---

## Passo a passo manual (se precisar)

### 1) Tentar Prisma (recomendado)

No seu computador, com variáveis de **produção** configuradas (`.env.prd` ou export no terminal):

```bash
npm run db:migrate:deploy
```

Se concluir sem erro, o banco está atualizado. Pode fazer o deploy.

Se der erro de conexão/pool (ex.: Supabase), use o passo 2.

### 2) Aplicar SQL manualmente (Supabase)

No **Supabase** → **SQL Editor** → New query:

1. **Auditoria (security_logs)**  
   Copie e execute todo o conteúdo de:
   - **`scripts/create-security-logs-table.sql`**

2. **Mediação e fechamento de casos**  
   Copie e execute todo o conteúdo de:
   - **`scripts/apply-mediation-migration.sql`**

Execute na ordem (1 depois 2). Os scripts são idempotentes (podem ser rodados mais de uma vez).

### 3) Conferir

No SQL Editor:

```sql
-- Deve listar a coluna (não dar erro)
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'casos' AND column_name = 'mediatedByAdminId';

-- Não precisa retornar linhas
SELECT 1 FROM security_logs LIMIT 1;
SELECT 1 FROM case_messages LIMIT 1;
```

Se nenhum comando der erro, o banco está pronto para o deploy.

---

## O que fica no banco

| Recurso | O que é criado |
|--------|------------------|
| Auditoria admin | Tabela `security_logs` |
| Mediação / fechamento | Colunas em `casos` (`mediatedByAdminId`, `mediatedAt`, `closedByAdminId`, `closedAt`, `closeReason`, `closeSummary`, `checklist`), enums `CloseReason`, `CaseMessageSenderRole`, `CaseMessageVisibility`, valor `EM_MEDIACAO` em `CasoStatus`, tabela `case_messages` |

Mais detalhes: **`docs/DEPLOYMENT.md`** (seção "Atualizar o banco antes do deploy").

# Atualizar a base de dados em produção

## Se você usa Vercel (recomendado)

**Nada manual.** O build já aplica as migrations no banco de produção:

1. No build da Vercel roda: `prisma generate` → `vercel-migrate-deploy.js` → `next build`.
2. O script `vercel-migrate-deploy.js` executa `prisma migrate deploy` **só na Vercel** (quando `VERCEL=1` e `DATABASE_URL` está definida).
3. Assim, a cada deploy as migrations pendentes são aplicadas no banco apontado por `DATABASE_URL`.

**O que conferir:**

- No projeto na Vercel: **Settings → Environment Variables**
- Garantir que **`DATABASE_URL`** existe e aponta para o Postgres de **produção** (não dev).
- Fazer o deploy (git push ou “Redeploy”); o build aplica as migrations e sobe a app.

---

## Se quiser aplicar migrations manualmente (antes ou sem Vercel)

Use o mesmo banco de produção (cuidado para não apontar para dev).

1. **Definir a URL do banco de produção** (só para esse comando):
   ```bash
   export DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
   ```
   Ou use o `.env.prd` se tiver (não commitar esse arquivo com senhas).

2. **Aplicar as migrations:**
   ```bash
   npm run db:migrate:deploy
   ```
   Ou:
   ```bash
   npx prisma migrate deploy
   ```

3. Isso aplica **todas** as migrations que ainda não foram aplicadas nesse banco (incluindo `add_notifications` e outras).

---

## Resumo

| Cenário              | Ação                                                                 |
|----------------------|----------------------------------------------------------------------|
| Deploy na Vercel     | Só fazer o deploy; migrations rodam no build se `DATABASE_URL` estiver definida. |
| Atualizar banco à mão | Rodar `DATABASE_URL=... npm run db:migrate:deploy` apontando para o banco de produção. |

**Importante:** Use sempre **migrations** (`prisma migrate deploy`) em produção. Não use `prisma db push` em prod; ele não gera histórico e pode causar perda de dados.

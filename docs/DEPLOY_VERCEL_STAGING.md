# Ambiente de testes (staging) na Vercel

Guia alinhado à prática usual em equipes que usam **Next.js + Vercel + Git**: homologação com **URL fixa**, **branch dedicada** e **infra isolada** da produção.

---

## Recomendação principal: dois projetos na Vercel, um repositório

| Projeto Vercel | Branch de “Production” do projeto | Quem recebe deploy automático | Exemplo de URL |
|----------------|-----------------------------------|-------------------------------|----------------|
| **Produção**   | `main`                            | Cada push em `main`           | `justapp.vercel.app` ou domínio próprio |
| **Staging**    | `staging` (ou `develop`)        | Cada push na branch de teste  | `justapp-staging.vercel.app` |

**Por quê dois projetos?**

- Na Vercel, cada projeto tem **uma** branch configurada como *Production Branch*.
- *Preview deployments* (outras branches / PRs) são ótimos para revisar PR, mas mudam URL, compartilham política de env e costumam **não** substituir um ambiente de QA estável.
- Com um projeto só para staging, você ganha **deploy contínuo da branch `staging`** com URL estável e variáveis próprias — sem misturar com `main`.

Fluxo Git sugerido:

```text
feature/* → Pull Request → staging (merge) → deploy automático em staging
staging   → Pull Request → main (merge)    → deploy automático em produção
```

---

## 1. Criar a branch `staging`

No repositório:

```bash
git checkout main
git pull
git checkout -b staging
git push -u origin staging
```

Proteja `main` e `staging` no GitHub/GitLab (reviews obrigatórios, se possível).

---

## 2. Criar o segundo projeto na Vercel

1. **Add New… → Project** → selecione o **mesmo** repositório.
2. Nome do projeto: ex. `justapp-staging` (diferente do de produção).
3. **Settings → Git → Production Branch** → altere de `main` para **`staging`**.
4. Faça um deploy (push em `staging` ou **Redeploy**).

Assim, “Production” **neste** projeto Vercel significa **sempre o último commit da branch `staging`**.

---

## 3. Variáveis de ambiente (staging separado de produção)

No projeto **staging**, em **Settings → Environment Variables**, preencha os mesmos nomes que em produção, com **valores de homologação**.

**Regra de ouro:** staging **não** deve usar o mesmo `DATABASE_URL` que produção.

| Variável | Staging |
|----------|---------|
| `DATABASE_URL` | Instância ou schema **só de teste** (ex.: outro banco no Supabase). |
| `NEXTAUTH_URL` | URL **exata** do projeto staging (`https://<projeto-staging>.vercel.app` ou domínio de teste). |
| `NEXTAUTH_SECRET` | Outro segredo forte (não reutilize o de produção). |
| `NEXT_PUBLIC_APP_URL` | Igual à URL pública do staging. |
| Google OAuth | Mesmo *Client ID* pode servir **se** você adicionar a URL de callback do staging no console Google; ou use client separado para clareza. |
| Stripe | Preferencialmente **chaves de teste** (`sk_test_…`, `pk_test_…`, webhook de teste). |
| `N8N_API_KEY` / integrações | Chaves só de teste ou ambiente n8n de homologação. |
| `CRON_SECRET` | Segredo próprio (diferente de produção). |

No projeto de **produção**, mantenha apenas variáveis de produção.

### Preview deployments (PRs abertos contra `staging` ou `main`)

- Se quiser que PRs usem **o mesmo banco de staging**, defina variáveis na seção **Preview** com cuidado (toda preview que apontar para o mesmo DB pode concorrer em migrações).
- Prática mais segura: previews com banco descartável ou desabilitar operações destrutivas; para este app, o mais simples é **homologar na URL fixa de staging** (merge na branch `staging`) e usar PR previews só para smoke test sem migrar schema crítico, conforme política do time.

---

## 4. Banco de dados e Prisma

O build na Vercel executa `scripts/vercel-migrate-deploy.js`, que roda `prisma migrate deploy` quando `VERCEL=1` e `DATABASE_URL` existem.

- **Staging:** `DATABASE_URL` do projeto staging aponta para o banco de teste → migrações aplicadas **só** lá.
- **Produção:** `DATABASE_URL` de produção → migrações **só** lá.

Nunca aponte o projeto staging para o mesmo banco de produção.

---

## 5. Google OAuth

No [Google Cloud Console](https://console.cloud.google.com/), em credenciais OAuth:

- **Authorized JavaScript origins:** inclua `https://<seu-staging>.vercel.app`.
- **Authorized redirect URIs:** inclua `https://<seu-staging>.vercel.app/api/auth/callback/google`.

O valor de `NEXTAUTH_URL` no staging deve ser exatamente a origem usada no navegador.

---

## 6. Stripe

- Staging: webhooks apontando para `https://<staging>/api/stripe/webhook` com secret de **modo teste**.
- Produção: URLs e secrets de modo live.

---

## 7. Crons (`vercel.json`)

Os crons definidos em `vercel.json` rodam nos **deployments de Production** de **cada** projeto. Ou seja:

- Projeto **produção** → crons contra API de produção (use `CRON_SECRET` de produção).
- Projeto **staging** → crons contra API de staging (configure `CRON_SECRET` diferente e URLs de e-mail/webhook de teste).

Se não quiser crons em staging, a opção é usar [Conditional configuration](https://vercel.com/docs/project-configuration) ou remover crons do projeto staging via duplicação de `vercel.json` (menos comum); muitos times **deixam** crons em staging com volume baixo para validar jobs.

---

## 8. Checklist rápido antes de liberar o time

- [ ] Projeto Vercel staging criado com Production Branch = `staging`.
- [ ] `DATABASE_URL` de homologação isolada.
- [ ] `NEXTAUTH_URL` e `NEXT_PUBLIC_APP_URL` = URL do staging.
- [ ] Redirect URIs do Google atualizados.
- [ ] Stripe (e outros webhooks) em modo teste no staging.
- [ ] Smoke test: login, um fluxo crítico, uma rota de API integrada.

---

## Referências no repositório

- Deploy geral: [DEPLOYMENT.md](DEPLOYMENT.md)
- Migrações no build: [DEPLOY_ATUALIZAR_BANCO.md](DEPLOY_ATUALIZAR_BANCO.md)
- Variáveis: [README.ENV.md](../README.ENV.md), [`.env.example`](../.env.example)

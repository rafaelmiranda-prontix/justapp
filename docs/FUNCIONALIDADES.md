# Catálogo de funcionalidades (JustApp / LegalConnect)

Documento único que resume **o que o sistema faz hoje**, com links para detalhes técnicos.  
Para setup e comandos, use [COMANDOS_UTEIS.md](COMANDOS_UTEIS.md) e [SETUP_COMPLETO.md](SETUP_COMPLETO.md).

---

## Visão do produto

Marketplace jurídico: **cidadão** descreve demanda (incluindo chat anônimo com IA), o sistema **qualifica e distribui** para **advogados** (leads / matches); há **mediação e fechamento** de casos pelo **admin**, **planos e assinaturas** (Stripe), **avaliações**, **notificações** e **integrações** (N8N, suporte WhatsApp).

---

## Autenticação e perfis

| Funcionalidade | Descrição |
|----------------|-----------|
| Login e cadastro | NextAuth: credenciais (e-mail/senha) e Google OAuth ([GOOGLE_OAUTH_SETUP.md](GOOGLE_OAUTH_SETUP.md)). |
| Papéis | `CIDADAO`, `ADVOGADO`, `ADMIN` — controle em middleware e APIs. |
| Ativação de conta | Contas podem nascer `PRE_ACTIVE` com token de ativação até virarem `ACTIVE`. |
| Sessão | JWT / sessão conforme `src/lib/auth.ts`; rotas sensíveis exigem usuário autenticado. |

---

## Área do cidadão (`/cidadao`)

- Dashboard e fluxo de **casos** (criação, acompanhamento de status).
- **Chat** com advogado após match (mensagens ligadas a `matches`).
- **Mensagens com admin** por caso (`case_messages` / APIs sob `/api/cidadao/casos/...`).
- Perfil e dados vinculados ao modelo `cidadaos`.

Documentação relacionada: [CHAT_CIDADAO_ADVOGADO.md](CHAT_CIDADAO_ADVOGADO.md), [ANONYMOUS_CHAT_FLOW.md](ANONYMOUS_CHAT_FLOW.md).

---

## Área do advogado (`/advogado`)

- Dashboard, **leads / matches** (aceitar, recusar, prazos).
- **Chat** com cidadão no contexto do match.
- **Planos e assinatura** (Stripe): limites de leads, upgrade/downgrade ([STRIPE_SETUP.md](STRIPE_SETUP.md)).
- Perfil público, especialidades, onboarding, suporte ao advogado (canais configuráveis).
- Fluxo **Beta / pré-aprovação**: advogado pode estar `preAprovado` antes de `aprovado` ([workflow-n8n-pre-aprovacao.md](workflow-n8n-pre-aprovacao.md)).
- **Audiências e diligências** (`/advogado/audiencias-diligencias`): perfil de **correspondente** (regiões, tipos aceitos, valor mínimo); **publicação** de serviços operacionais; **oportunidades** para correspondentes; **aceite** com trava concorrente; **chat interno**, **status**, **anexos** (prefixo `service-requests/` no bucket `chat-attachments` do Supabase); **avaliação** mútua após conclusão. APIs REST em `/api/service-requests/*`. Backlog: [features/backlog_modulo_audiencias_diligencias.md](features/backlog_modulo_audiencias_diligencias.md).

---

## Chat anônimo e qualificação

- Sessão anônima (`AnonymousSession`) com histórico em JSON, opcional uso de IA.
- Conversão para usuário/caso quando aplicável.
- Detalhes: [ANONYMOUS_CHAT_FLOW.md](ANONYMOUS_CHAT_FLOW.md).

---

## Distribuição de casos e matching

- Serviço de distribuição de casos para advogados compatíveis (localização, especialidade, plano, limites).
- **Matches** com status (pendente, aceito, recusado, etc.).
- Documentação: [CASE_DISTRIBUTION_FIX.md](CASE_DISTRIBUTION_FIX.md), [BUSINESS_RULES.md](BUSINESS_RULES.md).

---

## Notificações

- Modelo `Notification` com tipos (nova mensagem no chat, match, mudança de caso, mediação, serviços operacionais aceitos/mensagens/status etc.).
- Hooks/APIs para leitura e arquivo.

---

## Área administrativa (`/admin`)

Acesso apenas com `role === ADMIN`. Principais telas:

| Rota | Função |
|------|--------|
| `/admin/dashboard` | Resumo e atalhos. |
| `/admin/casos` | Gestão de casos, status, mediação admin↔cidadão, fechamento, checklist. |
| `/admin/advogados` | Aprovação, pré-aprovação, planos, moderação. |
| `/admin/leads` | Visão de quotas / leads. |
| `/admin/avaliacoes` | Moderação de avaliações. |
| `/admin/usuarios` | Usuários da plataforma. |
| `/admin/planos` | Configuração de planos e preços. |
| `/admin/configuracoes` | Chave-valor (`configuracoes`). |
| `/admin/chat-config` | Modo de chat (ex.: MVP vs Pusher). |
| `/admin/chat-mensagens` | Auditoria de mensagens **cidadão↔advogado** (integridade por match). |
| `/admin/suporte` | **Inbox de suporte WhatsApp** — conversas e mensagens ingeridas pela API `/api/suporte/*`. |
| `/admin/audiencias-diligencias` | Serviços operacionais (audiências/diligências): listagem, detalhe, trilha de auditoria, alteração de status com justificativa. |
| `/admin/analytics` | Funil / métricas. |
| `/admin/auditoria` | `security_logs` e trilha de ações. |
| `/admin/design-system` | Referência de UI (se em uso). |

---

## Suporte via WhatsApp (bot / n8n + Evolution)

Fluxo dedicado **fora** do chat de match/caso:

1. **Identificar** usuário existente por e-mail, telefone ou CRM (OAB): `POST /api/suporte/identify-user`.
2. Se não existir: **criar contato** (sem login no app): `POST /api/suporte/contacts`.
3. **Registrar mensagens** com idempotência (`externalMessageId`): `POST /api/suporte/messages`.
4. **Admin** acompanha em `/admin/suporte` e nas APIs `GET /api/admin/suporte/conversas` e `.../messages`.

Documentação: [suporte-whatsapp-api.md](suporte-whatsapp-api.md).  
Workflow n8n importável: [n8n-workflow-suporte-whatsapp-evolution.json](n8n-workflow-suporte-whatsapp-evolution.json).

**Autenticação das rotas `/api/suporte/*`:** `N8N_API_KEY` ou `INTEGRATION_API_KEY` (header `X-API-Key` ou Bearer não-JWT), e/ou JWT HS256 com `aud: integration` ([integration-auth em `src/lib/integration-auth.ts`](../src/lib/integration-auth.ts)).

---

## Integração N8N (pré-aprovação de advogados)

- `GET /api/n8n/advogados-pre-aprovados` — lista advogados pré-aprovados.
- `POST /api/n8n/advogados/:id/confirmar-aprovacao` — confirma aprovação final.

Autenticação: `N8N_API_KEY` ([workflow-n8n-pre-aprovacao.md](workflow-n8n-pre-aprovacao.md), [`src/lib/n8n-auth.ts`](../src/lib/n8n-auth.ts)).

---

## Formulário de contato público

- `POST /api/contato` — envio por e-mail (Resend etc.), independente do inbox WhatsApp.

---

## Dados principais (Prisma)

Resumo dos blocos em `prisma/schema.prisma`:

- **Usuários:** `users`, `accounts`, `sessions`; extensões `cidadaos`, `advogados`.
- **Casos:** `casos`, `case_messages` (admin/cidadão, público/interno), `matches`, `mensagens` (chat advogado/cidadão).
- **Negócio:** `especialidades`, `avaliacoes`, `planos`, `historicoAssinaturas`.
- **Qualificação anônima:** `AnonymousSession`.
- **Config / auditoria:** `configuracoes`, `security_logs`, `notifications`, `email_action_tokens`.
- **Suporte WhatsApp:** `SupportContact`, `SupportConversation`, `SupportMessage` (mapeados para `support_*`).

---

## Documentação por tema

| Tema | Arquivo |
|------|---------|
| Requisitos de produto | [PRD.md](PRD.md) |
| Contexto / roadmap histórico | [CONTEXT.md](CONTEXT.md) |
| Arquitetura e padrões | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Deploy / DB produção | [DEPLOYMENT.md](DEPLOYMENT.md), [DEPLOY_VERCEL_STAGING.md](DEPLOY_VERCEL_STAGING.md), [DEPLOY_PRODUCAO.md](DEPLOY_PRODUCAO.md), [ATUALIZAR_BANCO_PRODUCAO.md](ATUALIZAR_BANCO_PRODUCAO.md) |
| Segurança | [SECURITY_AUDIT.md](SECURITY_AUDIT.md) |
| Storage / anexos | [SUPABASE_STORAGE_SETUP.md](SUPABASE_STORAGE_SETUP.md), [SUPABASE_CHAT_ATTACHMENTS_SETUP.md](SUPABASE_CHAT_ATTACHMENTS_SETUP.md) |
| Admin | [ADMIN_SETUP.md](ADMIN_SETUP.md) |

---

## Variáveis de ambiente relevantes

Template: [../.env.example](../.env.example). Destaques:

- `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, OAuth Google.
- `N8N_API_KEY`, `INTEGRATION_API_KEY`, `INTEGRATION_JWT_SECRET` (integrações).
- Stripe, Resend, Pusher, provedores de IA — conforme docs temáticas acima.

---

*Última atualização: consolidado com suporte WhatsApp, APIs de integração e painel admin correspondente.*

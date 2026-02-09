> Observação de boas práticas incorporadas: **não marcar como lida só por listar**; marcar como lida quando o usuário **interage** (clicar no item / ação explícita) — isso evita “sumir” notificação só porque abriu o dropdown. ([Stack Overflow][1])
> E incluir “mark all as read” + higiene de inbox é padrão em notification centers. ([Courier][2])

---

## CONTEXTO ÚNICO — Feature Central de Notificações (Todos os perfis)

### 0) Objetivo

Implementar uma **central de notificações in-app** (bell no header) para **Cidadão / Advogado / Admin** com:

* Sino no header (direita) antes do menu/avatar.
* **Badge vermelho** com contagem de **não lidas** (1..99+).
* Ao clicar no sino: abre dropdown (desktop) / sheet (mobile) com **lista de notificações**.
* Notificação pode ser marcada como **lida**:

  * **Automático** ao clicar no item (recomendado)
  * **Manual** via botão por item e botão “Marcar todas como lidas”
* Página completa `/notificacoes` (recomendado) para ver tudo e filtrar.

Stack assumida: Next.js (App Router), Prisma + Postgres, autenticação já existente (session/user).

---

### 1) UX / Comportamento (obrigatório)

#### 1.1 Bell no Header

* Sempre que usuário estiver logado, exibir ícone do sino antes do menu/avatar.
* Se `unreadCount > 0` exibir badge vermelho com número:

  * 1..99 normal
  * > =100 mostrar `99+`

#### 1.2 Dropdown/Sheet (central rápida)

Ao clicar no sino:

* Abrir um painel com:

  * Título “Notificações”
  * Botão “Marcar todas como lidas”
  * Link “Ver todas” → `/notificacoes`
  * Lista (últimas 20 por padrão), ordenada por `createdAt desc`
* **Não marcar como lida só por abrir a lista**.
* Ao clicar em um item:

  1. marcar como lida via API
  2. navegar para `href`

#### 1.3 Página `/notificacoes`

* Rota: `/notificacoes`
* Filtros:

  * “Todas”
  * “Não lidas”
* (Opcional) filtro por tipo/categoria.
* Paginação por cursor ou `take/skip` (preferir cursor).

---

### 2) Modelo de dados (Prisma)

Criar tabela `Notification` (e enums) no schema Prisma.

**Enums**

* `UserRole`: `CITIZEN | LAWYER | ADMIN` (se já existir, reutilizar)
* `NotificationType` (MVP):

  * `CHAT_NEW_MESSAGE`
  * `MATCH_CREATED`
  * `MATCH_ACCEPTED`
  * `MATCH_REJECTED`
  * `CASE_STATUS_CHANGED`
  * `ADMIN_MEDIATION_ASSIGNED`
  * `ADMIN_ACTION_REQUIRED`
  * `SYSTEM`

**Model**

* `id` String @id @default(cuid())
* `userId` String (FK User)
* `role` UserRole (opcional se já tem no user; mas salvar ajuda auditoria)
* `type` NotificationType
* `title` String (curto)
* `message` String (curto, até ~160 chars recomendado)
* `href` String (rota destino)
* `metadata` Json? (ex.: `{ caseId, chatId, matchId }`)
* `createdAt` DateTime @default(now())
* `readAt` DateTime? (null = não lida)
* `archivedAt` DateTime? (futuro)

**Índices**

* @@index([userId, readAt])
* @@index([userId, createdAt])

**Regra de segurança**

* Usuário só pode ler/alterar notificações onde `notification.userId == session.user.id`.

---

### 3) APIs (Next.js App Router)

Todas as rotas exigem autenticação.

#### 3.1 GET unread count

`GET /api/notifications/unread-count`

* Response: `{ unreadCount: number }`

Implementação: `count where userId = session.user.id and readAt is null`

#### 3.2 GET list

`GET /api/notifications?status=all|unread&type=...&take=20&cursor=<id>`

* Defaults: `status=all`, `take=20`
* Response:

```json
{
  "items": [ /* Notification[] */ ],
  "nextCursor": "id-ou-null"
}
```

Cursor pagination:

* Buscar `take + 1` com `cursor` se fornecido.
* Ordenar por `createdAt desc`.
* `nextCursor` = último item se houver mais.

Filtro:

* `status=unread` → `readAt: null`
* `type` opcional → `type = ...`

#### 3.3 PATCH read single

`PATCH /api/notifications/:id/read`

* Marca `readAt = now()` se ainda estiver null.
* Response: `{ ok: true }`

#### 3.4 POST read all

`POST /api/notifications/read-all`

* Marca todas do usuário com `readAt null` para `now()`.
* Response: `{ updated: number }`

---

### 4) Serviço de domínio (criação de notificações)

Criar `src/lib/notificationService.ts` (ou equivalente) para centralizar criação.

Funções:

* `notifyUser(userId, payload)`
* `notifyMany(userIds, payload)`
* Payload:

```ts
{
  type: NotificationType
  title: string
  message: string
  href: string
  metadata?: any
  role?: UserRole // opcional
}
```

Regras:

* `title` e `message` devem ser curtos.
* `href` deve apontar para tela relevante e pode carregar `?notif=<notificationId>` (opcional).

---

### 5) Gatilhos (MVP) — onde chamar o notificationService

Implementar pelo menos estes eventos:

1. **Nova mensagem no chat**

* Quando A envia mensagem para B:

  * Criar `CHAT_NEW_MESSAGE` para B
  * `href` → `/chat/<chatId>` (ou rota equivalente)
  * `metadata` → `{ chatId, caseId? }`

2. **Novo match criado**

* Criar `MATCH_CREATED` para advogado alvo
* `href` → `/advogado/matches/<matchId>` (ou equivalente)

3. **Match aceito / recusado**

* Criar `MATCH_ACCEPTED` ou `MATCH_REJECTED` para cidadão
* `href` → `/casos/<caseId>` ou `/match/<matchId>`

4. **Mudança de status do caso**

* Criar `CASE_STATUS_CHANGED` para envolvidos (cidadão e advogado, e admin se aplicável)
* `href` → `/casos/<caseId>`

5. **Admin assume mediação**

* Criar `ADMIN_MEDIATION_ASSIGNED` para cidadão e/ou advogado
* `href` → `/casos/<caseId>/mediacao`

6. **Admin: ação requerida**

* Quando caso entra em fila/admin precisa agir:

  * Criar `ADMIN_ACTION_REQUIRED` para admins responsáveis
  * `href` → `/admin/casos/<caseId>`

(Se algum desses módulos ainda não existe, criar apenas o hook no ponto disponível e deixar os demais prontos.)

---

### 6) Componentes Frontend

#### 6.1 `NotificationBell`

* Renderiza ícone do sino.
* Faz fetch de `unread-count` (SWR/React Query ou `setInterval` simples).

  * Polling: a cada 30–60s enquanto logado.
* Ao abrir dropdown/sheet:

  * fetch `GET /api/notifications?take=20`

#### 6.2 `NotificationPanel` (Dropdown/Sheet)

* Header com ações:

  * “Marcar todas como lidas” → POST `/read-all`, depois refetch count/list
  * “Ver todas” → `/notificacoes`
* Lista de itens:

  * Visual diferente para não lidas
  * Clique no item:

    * `PATCH /:id/read`
    * `router.push(href)`

#### 6.3 Página `/notificacoes`

* Lista paginada com filtro “Não lidas”
* Ação “Marcar todas como lidas”

UI: usar componentes do design system existente (shadcn/ui se já estiver).

---

### 7) Critérios de Aceite (AC)

1. Todos os perfis (Cidadão/Advogado/Admin) veem o sino no header quando logados.
2. Badge vermelho mostra contagem correta de não lidas.
3. Dropdown/sheet lista as últimas notificações (ordem desc).
4. Clicar em uma notificação marca como lida e navega para o destino.
5. “Marcar todas como lidas” marca e zera o badge.
6. `/notificacoes` exibe todas e permite filtrar por não lidas.
7. Segurança: usuário não acessa notificações de outro usuário.

---

### 8) Extras (não obrigatório no MVP, mas deixar preparado)

* `archivedAt` para arquivar antigas.
* Deduplicação simples por janela de tempo (ex.: chat):

  * Se já existe notificação não lida do mesmo `chatId` recente, atualizar a mensagem ao invés de criar outra (opcional).
* Realtime no futuro (SSE/WebSocket).


[1]: https://stackoverflow.com/questions/62074590/notification-api-system-correct-process?utm_source=chatgpt.com "Notification Api System Correct Process"
[2]: https://www.courier.com/guides/how-to-build-a-notification-center/chapter-3-best-practices-for-notification-centers?utm_source=chatgpt.com "Notification Design: UX, Performance, Security"

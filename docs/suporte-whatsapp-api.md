# API de suporte WhatsApp (integração)

Índice geral do projeto: [FUNCIONALIDADES.md](./FUNCIONALIDADES.md).

Endpoints protegidos por **API Key** e/ou **JWT de serviço**. Configure no `.env`:

- `N8N_API_KEY` ou `INTEGRATION_API_KEY` (mínimo **16** caracteres) — header `X-API-Key` ou `Authorization: Bearer <chave>` (quando o valor **não** parece JWT).
- `INTEGRATION_JWT_SECRET` (mínimo **32** caracteres) — `Authorization: Bearer <jwt>` com algoritmo **HS256**, claim `aud: "integration"`.

## Fluxo recomendado (n8n / bot)

1. `POST /api/suporte/identify-user` com `email` e/ou `phone` e/ou `crm` (OAB).
   - Se `found: false` e `code: USER_NOT_FOUND` → chamar `POST /api/suporte/contacts` para criar contato + conversa.
   - Se `409` e `IDENTITY_CONFLICT` → dados ambíguos; tratar manualmente.
2. `POST /api/suporte/messages` com `conversationId`, `senderType` (`BOT` | `USER` | `AGENT`), `content`.
   - Use `externalMessageId` (ex.: id da mensagem do provedor) para **idempotência**.

### POST `/api/suporte/identify-user`

Body (JSON) — ao menos um campo:

```json
{
  "email": "user@example.com",
  "phone": "5511999999999",
  "crm": "OAB123456-SP",
  "whatsappWaId": "optional-wa-id-from-provider"
}
```

Respostas:

- `200` — usuário ativo encontrado: `found`, `userId`, `role`, `contactId`, `conversationId`, etc.
- `200` — não encontrado: `{ "found": false, "code": "USER_NOT_FOUND" }`
- `409` — `{ "code": "IDENTITY_CONFLICT" }`

### POST `/api/suporte/contacts`

Cria contato **sem** usuário do aplicativo e conversa aberta.

```json
{
  "name": "Fulano",
  "email": "a@b.com",
  "phone": "5511999999999",
  "whatsappWaId": "wa-id",
  "channel": "WHATSAPP",
  "source": "WHATSAPP"
}
```

### POST `/api/suporte/messages`

```json
{
  "conversationId": "cuid",
  "senderType": "USER",
  "content": "texto",
  "externalMessageId": "wamid.xxx",
  "metadata": { "raw": true }
}
```

## Admin

- Listagem: `GET /api/admin/suporte/conversas` (sessão **ADMIN**).
- Mensagens: `GET /api/admin/suporte/conversas/[conversationId]/messages`.

UI: `/admin/suporte`.

## JWT de exemplo (Node)

```bash
node -e "
const { SignJWT } = require('jose');
const secret = new TextEncoder().encode(process.env.INTEGRATION_JWT_SECRET);
(async () => {
  const jwt = await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .setAudience('integration')
    .sign(secret);
  console.log(jwt);
})();
"
```

Defina `INTEGRATION_JWT_SECRET` antes de rodar.

## Banco

Após puxar o código, aplique migrações: `npx prisma migrate deploy` (ou `migrate dev` em ambiente local).

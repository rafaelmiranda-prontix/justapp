# Workflow N8N – Pré-aprovação e confirmação de advogados

Este documento descreve o fluxo de pré-aprovação no sistema e o workflow sugerido para N8N, incluindo mecanismos de segurança.

## Fluxo no sistema

1. **Pendente** – Advogado se cadastrou; ainda não passou por análise.
2. **Pré-aprovado** – Admin fez a primeira análise (consulta órgãos, etc.) e clicou em **Pré-aprovar**. O advogado **não recebe leads**; aguarda confirmação.
3. **Aprovado** – Após o advogado confirmar (ex.: resposta no WhatsApp), o N8N chama a API para **confirmar aprovação**. Aí o advogado passa a **receber leads**.

A distribuição de casos (`CaseDistributionService`) só considera advogados com `aprovado === true`; pré-aprovados ficam de fora.

---

## APIs para o N8N

Todas as rotas N8N exigem **autenticação por API key**.

- **Header:** `X-API-Key: <sua-chave>` ou `Authorization: Bearer <sua-chave>`
- **Variável de ambiente:** `N8N_API_KEY` (mínimo 16 caracteres, valor secreto)

### 1. Listar pré-aprovados

**GET** `https://<seu-dominio>/api/n8n/advogados-pre-aprovados`

**Resposta (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "advogado-uuid",
      "name": "Nome do Advogado",
      "email": "email@exemplo.com",
      "phone": "(11) 99999-9999"
    }
  ]
}
```

Use essa lista para enviar mensagem por **WhatsApp** (campo `phone`) ou **e-mail** (campo `email`). O texto sugerido está em `docs/roteiro-comunicacao-advogados-beta.md` (incluir link das regras Beta e perguntar se deseja participar).

### 2. Confirmar aprovação (após OK do advogado)

**POST** `https://<seu-dominio>/api/n8n/advogados/:id/confirmar-aprovacao`

- **:id** = `id` do advogado retornado no GET acima.
- Corpo: vazio ou `{}`.

**Resposta (200):**

```json
{
  "success": true,
  "message": "Advogado aprovado com sucesso"
}
```

Se o advogado já estiver aprovado (chamada repetida):

```json
{
  "success": true,
  "message": "Advogado já estava aprovado",
  "alreadyApproved": true
}
```

**Erros:**

- **401** – API key inválida ou ausente.
- **400** – Advogado não está pré-aprovado (não use essa API para quem ainda está só pendente).
- **404** – Advogado não encontrado.

---

## Workflow sugerido no N8N

### Workflow 1 – Disparo da mensagem

1. **Trigger** – Cron (ex.: a cada 15 min) ou webhook manual.
2. **HTTP Request** – GET `.../api/n8n/advogados-pre-aprovados` com header `X-API-Key: {{ $env.N8N_API_KEY }}`.
3. **Loop** – Para cada item de `$json.data`:
   - Enviar mensagem por **WhatsApp** (usar `phone`) e/ou **E-mail** (usar `email`) com o roteiro Beta (link `/em-teste`, pergunta se quer participar).
   - (Opcional) Marcar em planilha/CRM que a mensagem foi enviada e aguardar resposta.

### Workflow 2 – Confirmação (após resposta “Sim” do advogado)

1. **Trigger** – Resposta no WhatsApp ou webhook do provedor de WhatsApp.
2. **Filtro** – Garantir que a resposta é “Sim” / “OK” / “Quero” (ou equivalente).
3. **Buscar** – Identificar o advogado (por telefone ou id guardado no passo anterior).
4. **HTTP Request** – POST `.../api/n8n/advogados/<advogadoId>/confirmar-aprovacao` com o mesmo header `X-API-Key`.
5. **Sucesso** – Enviar e-mail de boas-vindas (já enviado pela API) e/ou próxima instrução.

---

## Mecanismos de segurança

| Mecanismo | Descrição |
|-----------|-----------|
| **API key** | Todas as rotas `/api/n8n/*` exigem `N8N_API_KEY` em header. Sem chave ou chave errada → 401. |
| **Escopo mínimo** | GET retorna só pré-aprovados; POST só altera quem está `preAprovado=true` e `aprovado=false`. |
| **Idempotência** | Chamar POST de confirmação duas vezes para o mesmo advogado não quebra: na segunda vez retorna 200 com `alreadyApproved: true`. |
| **Sem elevação** | Não é possível aprovar direto um advogado pendente pela API N8N; ele precisa ter sido pré-aprovado no painel admin. |
| **Chave forte** | Use `N8N_API_KEY` com pelo menos 16 caracteres e guarde só no servidor e nas credenciais do N8N (nunca no front). |

Recomendações adicionais:

- Restringir IP de origem no N8N (se possível) para o IP do servidor onde o N8N roda.
- Em produção, usar HTTPS e manter o `N8N_API_KEY` em variável de ambiente segura (ex.: Vercel/railway).

---

## Resumo

- **Pré-aprovar** no painel admin → advogado entra na lista pré-aprovados e **não recebe leads**.
- **N8N** chama GET para listar, envia mensagem (WhatsApp/e-mail) com o roteiro Beta.
- Quando o advogado **confirmar**, N8N chama POST em `/api/n8n/advogados/:id/confirmar-aprovacao`.
- A API então marca o advogado como **aprovado** e ele passa a **receber leads**.

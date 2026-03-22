# Chat cidadão ↔ advogado – fluxo e diagnóstico

## Como o chat funciona

1. **Antes do aceite** – O match fica `PENDENTE` ou `VISUALIZADO`. **Não há chat**: a API bloqueia envio de mensagens. O cidadão **só vê** na lista conversas com status `ACEITO` ou `CONTRATADO` (advogado já aceitou).
2. **Depois do aceite** – Com status `ACEITO` ou `CONTRATADO`, ambos podem enviar mensagens pela API `POST /api/matches/[matchId]/messages`.
3. **Tempo real** – Com modo Pusher, novas mensagens chegam via WebSocket. Se o Pusher falhar, a mensagem **ainda é salva** no banco; a outra parte pode precisar **atualizar a página** para ver.

## Problema corrigido (bug)

- A API de mensagens só aceitava status **`ACEITO`**. Matches em **`CONTRATADO`** eram rejeitados com 403, embora o restante do sistema trate `CONTRATADO` como conversa ativa.
- O botão **“Abrir Chat”** no dashboard/casos do advogado só aparecia para `ACEITO`, não para `CONTRATADO`.

**Correção:** envio liberado para `ACEITO` e `CONTRATADO`; botão de chat também para `CONTRATADO`.

## Quando parece que “ninguém responde” (sem ser bug)

- **Advogado ainda não aceitou** – O cidadão não entra no chat com esse advogado até o aceite (não aparece na lista de conversas aceitas).
- **Comportamento humano** – O advogado pode não ter aberto o app ou respondido a tempo.
- **Conta do advogado** – Advogado não aprovado no admin pode não receber leads; fluxo de casos pode ser diferente.

## Limites técnicos

- **Rate limit:** até 10 mensagens por minuto por usuário no mesmo match (API).
- **Tamanho:** até 2000 caracteres por mensagem na rota principal (`/api/matches/.../messages`).

## Verificação rápida (suporte)

1. Confirmar **status do match** no banco ou no admin (`ACEITO` ou `CONTRATADO` para chat ativo).
2. Testar envio e ver resposta da API (403 com mensagem explicativa se o status for inválido).
3. Conferir variáveis **Pusher** se o problema for “mensagem enviada mas não aparece na hora”.

## Painel admin – auditoria de mensagens

No menu **Admin → Mensagens chat** (`/admin/chat-mensagens`):

- Lista mensagens com **remetente**, **destinatário inferido** (o outro participante do match) e **match/caso**.
- Indicador **OK** quando o remetente é o cidadão ou o advogado daquele match; **Problema** quando não bate (inconsistência de dados).
- Resumo: totais, últimos 7 dias e contagem de inconsistências nos últimos 7 dias.
- Filtro **Só inconsistências** para focar em registros suspeitos.

API: `GET /api/admin/chat-messages` (autenticação admin), query `page`, `limit`, `onlyProblems=true|false`.

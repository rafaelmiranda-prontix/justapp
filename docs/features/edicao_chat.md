# Backlog Técnico — Edição de mensagens no chat com segurança e auditoria

## Epic
Implementar edição de mensagens no chat cidadão ↔ advogado com regras de segurança, histórico de alterações e trilha de auditoria.

## Contexto
O produto já possui:
- chat entre cidadão e advogado no contexto de `matches`;
- área administrativa com auditoria;
- trilha de segurança em `security_logs`;
- auditoria de mensagens no admin.

Essa feature deve seguir o padrão de rastreabilidade já existente no sistema. :contentReference[oaicite:0]{index=0} :contentReference[oaicite:1]{index=1} :contentReference[oaicite:2]{index=2}

---

## Objetivo
Permitir que o autor edite sua própria mensagem dentro de uma janela limitada, mantendo:
- integridade da conversa;
- transparência para os participantes;
- histórico preservado para auditoria;
- prevenção de abuso.

---

## Escopo funcional
- edição de mensagens no chat cidadão ↔ advogado;
- apenas para o autor da mensagem;
- com janela de edição configurável;
- com indicador visual de mensagem editada;
- com armazenamento do histórico;
- com log de auditoria de segurança.

---

# Itens de backlog

## BE-01 — Criar modelo de histórico de edição de mensagens
**Tipo:** Backend / Banco  
**Prioridade:** Alta

### Descrição
Criar estrutura persistente para armazenar o histórico de edições de cada mensagem.

### Tarefas
- criar tabela/modelo `message_edit_history`;
- relacionar com `mensagens`;
- armazenar conteúdo anterior e novo conteúdo;
- armazenar usuário responsável pela edição;
- armazenar data/hora da edição.

### Estrutura sugerida
- `id`
- `messageId`
- `previousContent`
- `newContent`
- `editedByUserId`
- `editedAt`

### Critérios de aceite
- a aplicação consegue persistir múltiplas edições para a mesma mensagem;
- cada edição fica associada à mensagem original;
- histórico pode ser consultado posteriormente pelo admin.

---

## BE-02 — Evoluir schema da mensagem para suportar edição
**Tipo:** Backend / Banco  
**Prioridade:** Alta

### Descrição
Adicionar metadados na entidade de mensagem para suportar edição controlada.

### Tarefas
Adicionar na tabela/modelo de mensagens:
- `isEdited` boolean
- `editedAt` datetime nullable
- `editCount` integer default 0
- `lastEditedBy` nullable

### Critérios de aceite
- mensagens novas continuam funcionando sem impacto;
- mensagens editadas passam a refletir os novos metadados;
- o modelo permite identificar rapidamente se houve edição.

---

## BE-03 — Criar regra de negócio para elegibilidade de edição
**Tipo:** Backend  
**Prioridade:** Alta

### Descrição
Implementar serviço de validação para determinar se uma mensagem pode ser editada.

### Regras
- apenas o autor pode editar;
- apenas mensagens do chat cidadão ↔ advogado;
- apenas dentro da janela configurada;
- mensagem removida não pode ser editada;
- mensagem bloqueada para investigação não pode ser editada;
- match/caso bloqueado pode impedir edição.

### Tarefas
- criar função/serviço `canEditMessage`;
- validar ownership no backend;
- validar tempo decorrido desde criação;
- validar status da mensagem;
- validar status do contexto (`match` / `caso`).

### Critérios de aceite
- usuário não autor recebe bloqueio;
- mensagem expirada recebe bloqueio;
- regras ficam centralizadas em serviço reutilizável.

---

## BE-04 — Criar endpoint/API para editar mensagem
**Tipo:** Backend / API  
**Prioridade:** Alta

### Descrição
Criar endpoint seguro para edição de mensagem.

### Sugestão
- `PATCH /api/chat/messages/:id`

### Payload sugerido
```json
{
  "content": "novo texto da mensagem"
}
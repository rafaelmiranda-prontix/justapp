# Refino de Backlog — Chat do Serviço entre Advogados

## Contexto

A plataforma já possui funcionalidades de chat em outros fluxos, como comunicação entre cidadão e advogado, trilha de auditoria administrativa e gestão de mensagens no contexto de casos e matches. Isso mostra que existe base funcional e arquitetural para evoluir um **chat contextual por serviço** dentro do novo módulo de **Audiências e Diligências**, reaproveitando componentes, padrões de autenticação, notificações e auditoria já existentes. fileciteturn1file0

Além disso, o produto já opera com áreas separadas para advogado, admin e integrações, o que favorece a criação de um chat transacional vinculado ao serviço, com controle de acesso por perfil, persistência de mensagens e possibilidade de moderação administrativa. fileciteturn1file0 fileciteturn1file1

---

## Objetivo do refino

Detalhar o escopo do **chat do serviço entre advogados** no módulo de **Audiências e Diligências**, com foco em:

- comunicação contextual entre solicitante e correspondente
- troca segura de informações operacionais
- envio de instruções e anexos
- rastreabilidade e auditoria
- mensagem de boas práticas de segurança
- base pronta para implementação incremental

---

## Nome sugerido da funcionalidade

**Chat do Serviço**

Nome técnico alternativo:
- `service_chat`
- `chat_diligencia`
- `chat_audiencia`

---

## Problema que o chat resolve

Hoje, esse tipo de alinhamento costuma acontecer por WhatsApp ou meios externos, gerando problemas como:

- perda de histórico
- falta de rastreabilidade
- dificuldade para auditar o que foi combinado
- compartilhamento inseguro de documentos
- desencontro de informações operacionais
- ausência de contexto vinculado ao serviço

O chat interno resolve isso ao centralizar toda a comunicação do serviço dentro da plataforma.

---

## Proposta funcional

Cada serviço publicado e aceito terá um **chat exclusivo**, acessível apenas para:

- advogado solicitante
- advogado correspondente selecionado
- administradores autorizados, para auditoria/mediação

Esse chat será vinculado ao registro do serviço e servirá para:

- alinhar instruções
- confirmar detalhes da audiência/diligência
- compartilhar documentos
- registrar atualizações de execução
- manter histórico oficial da operação

---

## Escopo funcional do MVP do chat

O MVP do chat deve permitir:

- envio de mensagens de texto
- exibição de histórico em ordem cronológica
- identificação do autor da mensagem
- timestamp por mensagem
- aviso visual de novas mensagens
- vínculo do chat a um serviço específico
- acesso somente após o aceite do serviço
- visualização pelo admin em modo auditoria
- mensagem fixa inicial de segurança
- envio de anexos simples (opcional no MVP, recomendado se já existir componente reutilizável)

---

## Regras de negócio

### Acesso
- o chat só pode ser iniciado quando o serviço estiver ao menos no status **Aceito**
- apenas os dois advogados envolvidos no serviço podem enviar mensagens
- administradores podem visualizar o chat para suporte, moderação e auditoria
- usuários externos ao serviço não podem visualizar nem interagir

### Contexto
- cada chat pertence a um único serviço
- não pode existir mistura de mensagens entre serviços diferentes
- ao acessar o chat, o usuário deve ver um cabeçalho com resumo do serviço:
  - tipo
  - local
  - data/hora
  - status
  - valor ofertado

### Integridade
- mensagens não podem ser editadas no MVP
- exclusão de mensagem por usuário final não deve existir no MVP
- qualquer ação administrativa extraordinária deve gerar trilha de auditoria

### Encerramento
- o chat continua visível após conclusão do serviço, em modo histórico
- após status final de **Concluído** ou **Cancelado**, novas mensagens podem:
  - continuar habilitadas por período curto, ou
  - ser bloqueadas conforme regra de produto
- recomendação inicial: manter bloqueado após conclusão, com exceção de admins

---

## Mensagem fixa de boas práticas de segurança

### Objetivo
Exibir no topo do chat uma mensagem persistente e amigável reforçando condutas seguras.

### Texto sugerido
**Boas práticas de segurança:** use este chat apenas para informações relacionadas ao serviço. Evite compartilhar senhas, dados bancários sensíveis, documentos desnecessários ou informações pessoais além do necessário para a execução da diligência. Antes de enviar anexos ou dados relevantes, confirme se são realmente indispensáveis. Consulte a política completa de segurança em: **[Política de Segurança](https://SEU-LINK-DE-POLITICA-AQUI)**.

### Requisitos dessa mensagem
- deve aparecer no topo da conversa
- deve ter destaque visual discreto, mas permanente
- o link deve abrir em nova aba
- o texto deve ser configurável por admin em fase futura
- no MVP pode ser constante via configuração ou frontend

---

## Regras de segurança e conformidade

### Conteúdo sensível
O chat deve desencorajar compartilhamento de:
- senhas
- tokens
- acessos de sistemas
- dados bancários completos
- documentos não relacionados ao serviço
- dados excessivos de terceiros

### Uploads
Ao permitir anexos:
- restringir extensões permitidas
- validar tamanho máximo
- registrar autor e horário do upload
- armazenar em repositório seguro
- preferir arquivos vinculados ao serviço, não inline externos

### Auditoria
Registrar pelo menos:
- criação do chat
- envio de mensagens
- upload de anexos
- leitura opcional em fase futura
- visualização/admin actions relevantes

### Moderação
Admin deve poder:
- visualizar mensagens
- localizar serviços com conflito
- intervir manualmente no fluxo operacional
- registrar observação interna fora do chat do usuário em fase futura

---

## UX sugerida

### Estrutura da tela
- cabeçalho com resumo do serviço
- banner de segurança logo abaixo do cabeçalho
- área de mensagens
- composer de texto
- botão de anexo
- marcador de mensagens novas
- estado vazio amigável quando ainda não houver mensagens

### Mensagem automática inicial do sistema
Ao abrir o chat pela primeira vez, o sistema pode registrar:

> Chat do serviço iniciado. Utilize este espaço para alinhar instruções, documentos e atualizações da diligência com segurança e objetividade.

---

## Eventos e notificações

Disparar notificação quando:
- uma nova mensagem for enviada
- um anexo for compartilhado
- o serviço mudar de status e isso impactar o chat
- o admin intervier no fluxo em fase futura

Canais possíveis:
- notificação in-app
- badge no menu
- e-mail em fase futura
- push em fase futura

O sistema já possui base de notificações por eventos, o que ajuda a reaproveitar esse padrão no módulo novo. fileciteturn1file0

---

## Requisitos funcionais detalhados

### RF-CHAT-001 — Criar chat por serviço
O sistema deve criar automaticamente um chat vinculado ao serviço quando houver aceite por um correspondente.

### RF-CHAT-002 — Exibir histórico
O sistema deve listar as mensagens do serviço em ordem cronológica, com autor, data e hora.

### RF-CHAT-003 — Enviar mensagem
O advogado participante deve conseguir enviar mensagem textual no contexto do serviço.

### RF-CHAT-004 — Restringir acesso
O sistema deve garantir que apenas os participantes do serviço e admins autorizados visualizem o chat.

### RF-CHAT-005 — Exibir mensagem de segurança
O sistema deve exibir uma mensagem fixa de boas práticas de segurança no topo do chat, com link para a política completa.

### RF-CHAT-006 — Notificar nova mensagem
O sistema deve gerar notificação ao participante quando houver nova mensagem não lida.

### RF-CHAT-007 — Auditoria administrativa
O admin deve conseguir visualizar o histórico do chat para auditoria e suporte.

### RF-CHAT-008 — Anexos
O sistema deve permitir envio de anexos vinculados ao serviço, respeitando regras de tipo e tamanho.

### RF-CHAT-009 — Estado do chat por status do serviço
O sistema deve controlar disponibilidade do chat conforme o status do serviço.

---

## Requisitos não funcionais

### RNF-CHAT-001 — Segurança
As mensagens devem respeitar autenticação, autorização e segregação por serviço.

### RNF-CHAT-002 — Performance
O histórico deve carregar com paginação ou lazy load em conversas extensas.

### RNF-CHAT-003 — Auditoria
Todas as ações críticas do chat devem ser registradas.

### RNF-CHAT-004 — Usabilidade
A interface deve ser simples, responsiva e adequada para uso rápido em contexto operacional.

### RNF-CHAT-005 — Escalabilidade
A modelagem deve permitir futura evolução para tempo real com polling, websocket ou Pusher.

---

## Modelo de dados sugerido

### `service_chats`
- id
- service_request_id
- created_at
- updated_at

### `service_chat_messages`
- id
- service_chat_id
- sender_user_id
- message_type (`text`, `system`, `attachment`)
- content
- attachment_url
- attachment_name
- attachment_size
- created_at

### `service_chat_reads` *(fase futura)*
- id
- service_chat_id
- user_id
- last_read_message_id
- read_at

---

## Backlog por contexto

## Contexto 1 — Estrutura base do chat
### Objetivo
Criar a base técnica e funcional do chat por serviço.

### Itens
- criar entidade de chat vinculada ao serviço
- criar entidade de mensagens
- criar endpoint/listagem de mensagens
- criar endpoint/envio de mensagem
- validar acesso por participantes do serviço
- criar mensagem automática inicial do sistema

### Critérios de aceite
- serviço aceito gera chat
- participantes conseguem visualizar histórico
- participante autorizado consegue enviar mensagem
- usuário não autorizado recebe bloqueio de acesso

---

## Contexto 2 — Interface do chat no painel do advogado
### Objetivo
Disponibilizar a experiência de uso no painel do advogado.

### Itens
- criar tela/aba “Chat do serviço”
- exibir cabeçalho com resumo do serviço
- renderizar lista de mensagens
- criar composer de nova mensagem
- exibir timestamps e autor
- tratar estado vazio
- tratar loading e erro

### Critérios de aceite
- advogado solicitante acessa chat do serviço publicado/aceito
- correspondente acessa o mesmo histórico
- UI fica responsiva em desktop e mobile

---

## Contexto 3 — Banner de segurança e política
### Objetivo
Adicionar orientação explícita de segurança no uso do chat.

### Itens
- criar componente visual de banner fixo
- incluir texto de boas práticas
- incluir link para política completa de segurança
- abrir link em nova aba
- permitir futura parametrização pelo admin

### Critérios de aceite
- banner aparece no topo do chat
- link funciona corretamente
- texto permanece visível durante o uso da conversa

---

## Contexto 4 — Notificações
### Objetivo
Avisar os participantes sobre novas interações no chat.

### Itens
- gerar evento de notificação ao enviar mensagem
- exibir badge/indicador visual
- marcar conversa com mensagens pendentes
- limpar indicador após leitura/acesso em fase inicial simplificada

### Critérios de aceite
- nova mensagem gera notificação para a contraparte
- usuário vê indicação de nova interação no painel

---

## Contexto 5 — Auditoria e admin
### Objetivo
Permitir governança e suporte operacional.

### Itens
- disponibilizar visualização do chat para admin
- registrar eventos relevantes em trilha de auditoria
- permitir busca por serviço/chat
- permitir inspeção em caso de conflito

### Critérios de aceite
- admin acessa histórico sem se passar por usuário
- ações críticas ficam registradas

---

## Contexto 6 — Anexos no chat
### Objetivo
Permitir troca de documentos operacionais com segurança.

### Itens
- habilitar upload de arquivo
- validar tipo e tamanho
- armazenar com vínculo ao serviço/chat
- exibir anexo no histórico
- registrar upload na auditoria

### Critérios de aceite
- participante envia arquivo permitido
- contraparte consegue visualizar/baixar
- arquivo fica associado ao serviço correto

---

## Contexto 7 — Regras de encerramento
### Objetivo
Controlar comportamento do chat após fim do serviço.

### Itens
- definir bloqueio de envio após conclusão/cancelamento
- manter histórico disponível em modo leitura
- exibir status final no cabeçalho
- tratar exceções administrativas

### Critérios de aceite
- serviço concluído mantém histórico íntegro
- envio de novas mensagens respeita a regra definida

---

## User stories sugeridas

### US-CHAT-01
Como advogado solicitante, quero conversar com o correspondente dentro do serviço para alinhar detalhes sem depender de canais externos.

### US-CHAT-02
Como advogado correspondente, quero receber instruções e anexos no contexto da diligência para executar o serviço corretamente.

### US-CHAT-03
Como usuário da plataforma, quero visualizar uma mensagem de boas práticas de segurança para evitar compartilhamento indevido de dados no chat.

### US-CHAT-04
Como administrador, quero auditar o chat do serviço para apoiar resolução de conflitos e garantir governança.

### US-CHAT-05
Como participante do serviço, quero ser notificado sobre novas mensagens para responder no tempo adequado.

---

## Priorização sugerida

### Sprint / onda 1
- estrutura base do chat
- UI mínima
- controle de acesso
- mensagem automática inicial
- banner de segurança com link

### Sprint / onda 2
- notificações
- auditoria admin
- ajustes de UX

### Sprint / onda 3
- anexos
- regras refinadas de encerramento
- leitura/não lidas
- futura evolução para realtime

---

## Dependências

- entidade de serviço já implementada
- autenticação e autorização por perfil
- base de notificações reutilizável
- estratégia de storage para anexos
- trilha de auditoria disponível
- definição da URL oficial da política de segurança

---

## Pendências de decisão

- qual será a URL oficial da política de segurança
- anexos entram no MVP ou fase 2
- chat ficará aberto ou bloqueado após conclusão
- haverá tempo real já no MVP ou polling inicial
- admin poderá só visualizar ou também atuar com mensagens internas

---

## Recomendação final

A primeira versão do chat deve ser **simples, contextual, segura e auditável**.

A combinação ideal para o MVP é:
- chat por serviço
- texto + histórico
- controle rigoroso de acesso
- banner fixo de segurança
- link para política completa
- visibilidade administrativa

Isso já entrega valor real e evita que a operação fique espalhada em canais externos.

---

## Placeholder oficial para a política

Substituir este link pelo endereço oficial da política:

`https://SEU-LINK-DE-POLITICA-AQUI`

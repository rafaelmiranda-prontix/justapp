# Refino de Backlog — Chat do Serviço + Edição do Serviço + Distribuição por Cotas

## Contexto

A plataforma já possui funcionalidades de chat em outros fluxos, como comunicação entre cidadão e advogado, trilha de auditoria administrativa e gestão de mensagens no contexto de casos e matches. Isso mostra que existe base funcional e arquitetural para evoluir um **chat contextual por serviço** dentro do novo módulo de **Audiências e Diligências**, reaproveitando componentes, padrões de autenticação, notificações e auditoria já existentes. fileciteturn1file0

Além disso, o produto já opera com áreas separadas para advogado, admin e integrações, o que favorece a criação de um chat transacional vinculado ao serviço, com controle de acesso por perfil, persistência de mensagens e possibilidade de moderação administrativa. A plataforma também já trabalha com **planos e assinaturas**, o que favorece a implementação de regras de distribuição com cotas parametrizadas por plano e monitoradas no painel administrativo. fileciteturn1file0 fileciteturn1file1

---

## Objetivo do refino

Detalhar o escopo de três frentes do módulo de **Audiências e Diligências**:

1. **Chat do serviço entre advogados**
2. **Edição do serviço pelo advogado publicador com trilha de histórico**
3. **Distribuição performática com cotas relativas ao plano do usuário e acompanhamento administrativo**

---

# Parte 1 — Chat do Serviço entre Advogados

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

## Escopo funcional do MVP do chat

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

## Mensagem fixa de boas práticas de segurança

**Boas práticas de segurança:** use este chat apenas para informações relacionadas ao serviço. Evite compartilhar senhas, dados bancários sensíveis, documentos desnecessários ou informações pessoais além do necessário para a execução da diligência. Antes de enviar anexos ou dados relevantes, confirme se são realmente indispensáveis. Consulte a política completa de segurança em: **[Política de Segurança](https://SEU-LINK-DE-POLITICA-AQUI)**.

### Requisitos dessa mensagem
- deve aparecer no topo da conversa
- deve ter destaque visual discreto, mas permanente
- o link deve abrir em nova aba
- o texto deve ser configurável por admin em fase futura
- no MVP pode ser constante via configuração ou frontend

---

# Parte 2 — Edição do Serviço pelo Advogado Publicador

## Objetivo

Permitir que o advogado que publicou o serviço possa editar as informações do serviço quando necessário, sem perder rastreabilidade.

## Regra principal

- o advogado publicador pode editar o serviço enquanto ele estiver em status anterior ao aceite
- após o serviço ser **aceito**, a edição continua permitida apenas para campos autorizados pela regra de negócio
- toda edição realizada **após o aceite** deve gerar registro obrigatório no **histórico do serviço**
- dependendo do impacto da alteração, o correspondente deve ser notificado

## Justificativa

Na operação real, é comum haver ajustes após a publicação, como:
- mudança de horário
- ajuste de local
- inclusão de instruções
- anexação de novos documentos
- correção de detalhes operacionais

Essas alterações não podem ocorrer de forma “silenciosa”, porque impactam a execução do correspondente e podem gerar conflito.

## Regras de edição sugeridas

### Antes do aceite
O advogado publicador pode editar livremente:
- título
- descrição
- tipo de serviço
- data/hora
- local/fórum/comarca
- valor ofertado
- anexos
- observações
- prazo de aceite

### Após o aceite
A edição deve ser mais restrita.

#### Campos que podem continuar editáveis
- descrição complementar
- observações
- anexos
- instruções adicionais
- detalhes operacionais secundários

#### Campos sensíveis com regra especial
- data/hora
- local/fórum
- valor
- tipo de serviço

Para esses campos, recomenda-se:
- permitir edição apenas com justificativa obrigatória
- registrar alteração no histórico
- notificar o correspondente
- em casos futuros, exigir aceite da alteração se impacto for alto

### Campos não editáveis após aceite no MVP
Como simplificação inicial, pode-se bloquear:
- identidade do solicitante
- correspondente selecionado
- vínculo do serviço
- status base do fluxo, exceto pelas ações oficiais do processo

## Histórico do serviço

Toda edição após aceite deve gerar um evento em histórico com:
- data/hora da alteração
- usuário responsável
- campo alterado
- valor anterior
- valor novo
- justificativa, quando aplicável

### Exemplo de histórico
- “Solicitante alterou horário de 14:00 para 15:30”
- “Solicitante adicionou instruções complementares”
- “Solicitante atualizou local do fórum”
- “Solicitante anexou novo documento”

## Notificações decorrentes da edição

Quando houver edição após aceite, o correspondente deve receber notificação se a alteração afetar a execução.

Eventos prioritários:
- mudança de data/hora
- mudança de local
- mudança de instrução
- novo anexo
- alteração de valor, se permitido

## Requisitos funcionais — edição

### RF-SERVICE-EDIT-001 — Editar serviço antes do aceite
O sistema deve permitir edição do serviço pelo advogado publicador antes do aceite.

### RF-SERVICE-EDIT-002 — Editar serviço após aceite com restrição
O sistema deve permitir edição apenas de campos autorizados após o aceite.

### RF-SERVICE-EDIT-003 — Registrar histórico
Toda edição após aceite deve gerar evento no histórico do serviço com trilha detalhada da alteração.

### RF-SERVICE-EDIT-004 — Exigir justificativa para campos sensíveis
O sistema deve exigir justificativa quando o usuário alterar campos sensíveis após o aceite.

### RF-SERVICE-EDIT-005 — Notificar correspondente
O sistema deve notificar o correspondente quando a alteração impactar a execução do serviço.

## Modelo de dados sugerido para histórico de edição

### `service_change_history`
- id
- service_request_id
- changed_by_user_id
- change_type (`update`, `attachment_added`, `schedule_changed`, `location_changed`)
- field_name
- old_value
- new_value
- reason
- created_at

---

# Parte 3 — Método de Distribuição Performático com Cotas por Plano

## Objetivo

Definir um método de distribuição de oportunidades de serviço para correspondentes que seja:
- performático
- previsível
- escalável
- justo
- aderente ao plano do usuário
- auditável pelo admin

## Problema a resolver

Sem um método estruturado de distribuição, a plataforma pode sofrer com:
- excesso de concorrência em cima do mesmo serviço
- distribuição desbalanceada
- experiência ruim para planos premium
- consultas pesadas e lentas
- dificuldade para controlar exposição de oportunidades
- falta de previsibilidade comercial

## Princípio da distribuição

A oportunidade publicada não deve ser exposta de forma indiscriminada para todos os advogados.

Ela deve ser distribuída com base em:
- região
- elegibilidade
- tipo de serviço
- disponibilidade
- perfil ativo como correspondente
- regras do plano
- cotas de exposição e/ou aceite

## Estratégia recomendada

### Etapa 1 — Pré-filtragem performática
Ao publicar o serviço, o sistema gera um conjunto inicial de candidatos elegíveis com base em:
- região/comarca/fórum
- tipo de serviço compatível
- correspondente ativo
- status do cadastro apto
- disponibilidade básica
- usuário não bloqueado/suspenso

### Etapa 2 — Aplicação de regra de plano
Depois do filtro inicial, o sistema aplica a regra de distribuição relativa ao plano do usuário correspondente.

Exemplos de parâmetros por plano:
- quantidade máxima de oportunidades visíveis por período
- prioridade de exibição
- raio geográfico máximo elegível
- limite de candidaturas por período
- limite de serviços simultâneos
- ordem de priorização no lote de distribuição

### Etapa 3 — Lote de distribuição
Em vez de expor para toda a base, o sistema distribui em lotes menores e controlados.

Exemplo:
- primeiro lote para correspondentes premium/local mais próximo
- segundo lote após janela de tempo sem aceite
- terceiro lote com expansão regional

Isso melhora:
- performance
- conversão
- percepção de exclusividade
- controle de cota

## Cotas por plano

As cotas devem ser parametrizadas no plano e vinculadas ao usuário correspondente.

### Exemplos de cotas
- oportunidades recebidas por mês
- candidaturas permitidas por mês
- aceitações simultâneas máximas
- raio máximo de distribuição
- prioridade de rankeamento
- acesso antecipado a novas oportunidades
- limite de categorias/tipos de serviço

## Parametrização no plano

O plano do usuário deve permitir configuração administrativa de campos como:

### `plan_distribution_rules`
- monthly_opportunity_quota
- monthly_application_quota
- max_active_services
- priority_weight
- max_distribution_radius_km
- early_access_minutes
- allowed_service_types
- queue_tier

Esses parâmetros podem estar:
- dentro da estrutura já existente do plano, ou
- em tabela complementar vinculada ao plano

## Acompanhamento de cota no painel admin

Deve existir uma área administrativa para acompanhar cotas por usuário e por plano.

### Menu sugerido no painel admin
**Cotas de Distribuição**

Subitens:
- visão por plano
- visão por advogado
- consumo no período
- saldo de cota
- exceções e ajustes manuais
- histórico de consumo

### Informações mínimas por advogado
- plano atual
- cota mensal configurada
- oportunidades recebidas no mês
- candidaturas realizadas no mês
- serviços ativos
- saldo restante
- status da elegibilidade

### Informações mínimas por plano
- nome do plano
- regras de distribuição
- número de usuários no plano
- consumo agregado
- taxa de conversão por plano

## Regra operacional de consumo de cota

É importante decidir o que consome cota.

### Recomendação inicial
Separar cotas em três níveis:
1. **Cota de exposição**: quando a oportunidade é entregue ao advogado
2. **Cota de candidatura**: quando o advogado demonstra interesse/aceita disputar
3. **Cota de execução ativa**: quando o advogado assume o serviço

Isso dá maior controle comercial e operacional.

## Regras de performance

Para manter a distribuição performática, recomenda-se:
- pré-indexar correspondentes por região/comarca/tipo
- evitar varrer todos os advogados a cada publicação
- usar consultas paginadas/loteadas
- gerar fila de candidatos elegíveis
- materializar elegibilidade básica quando possível
- desacoplar publicação da distribuição síncrona em fases futuras

### Estratégia MVP performática
No MVP:
- filtro síncrono com índices bem definidos
- limite de lote de distribuição
- ordenação por prioridade de plano + proximidade + disponibilidade
- atualização de contadores de cota em transação segura

### Estratégia fase futura
- fila assíncrona de distribuição
- reprocessamento por janela
- expansão automática de raio e lote
- score dinâmico de correspondentes

## Requisitos funcionais — distribuição e cotas

### RF-DIST-001 — Filtrar elegíveis
O sistema deve filtrar correspondentes elegíveis por região, tipo de serviço, status e perfil ativo.

### RF-DIST-002 — Aplicar regras do plano
O sistema deve aplicar cotas e prioridade conforme parâmetros do plano do usuário.

### RF-DIST-003 — Distribuir em lotes
O sistema deve distribuir oportunidades em lotes controlados, evitando exposição indiscriminada.

### RF-DIST-004 — Registrar consumo de cota
O sistema deve registrar o consumo de cota por advogado e por tipo de evento.

### RF-DIST-005 — Exibir cota no admin
O admin deve conseguir acompanhar consumo de cotas por plano e por advogado em menu dedicado.

### RF-DIST-006 — Permitir parametrização no plano
O admin deve conseguir configurar regras de cota e distribuição vinculadas ao plano.

### RF-DIST-007 — Reprocessar distribuição
O sistema deve permitir expansão da distribuição quando a oportunidade não tiver aceite dentro da janela definida.

## Modelo de dados sugerido — cotas e distribuição

### `plan_distribution_rules`
- id
- plan_id
- monthly_opportunity_quota
- monthly_application_quota
- max_active_services
- priority_weight
- max_distribution_radius_km
- early_access_minutes
- queue_tier
- created_at
- updated_at

### `user_distribution_quota_usage`
- id
- user_id
- plan_id
- reference_month
- opportunities_received
- applications_made
- active_services_count
- updated_at

### `service_distribution_batches`
- id
- service_request_id
- batch_number
- distributed_at
- candidate_count
- acceptance_window_ends_at
- status

### `service_distribution_candidates`
- id
- service_request_id
- user_id
- batch_id
- priority_score
- quota_snapshot
- delivered_at
- viewed_at
- responded_at
- outcome

---

# Backlog por contexto

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

## Contexto 4 — Edição do serviço pelo publicador
### Objetivo
Permitir ajuste controlado do serviço publicado, com governança após aceite.

### Itens
- criar ação de editar serviço
- separar campos editáveis antes e depois do aceite
- exigir justificativa para campos sensíveis após aceite
- registrar histórico detalhado da alteração
- notificar correspondente em alterações relevantes
- exibir histórico no detalhe do serviço

### Critérios de aceite
- publicador consegue editar antes do aceite
- após aceite, o sistema aplica restrições corretamente
- alteração pós-aceite gera histórico completo
- correspondente é notificado quando a alteração impacta a execução

---

## Contexto 5 — Distribuição elegível e performática
### Objetivo
Implementar distribuição controlada e eficiente das oportunidades.

### Itens
- criar filtro de elegibilidade por região/tipo/status
- ordenar candidatos por prioridade de plano + proximidade
- limitar quantidade por lote
- registrar candidatos distribuídos
- preparar reprocessamento por lote sem aceite

### Critérios de aceite
- sistema não distribui para toda a base indiscriminadamente
- oportunidades são entregues apenas a elegíveis
- lote inicial respeita regra de priorização

---

## Contexto 6 — Cotas por plano
### Objetivo
Controlar a distribuição com base no plano contratado.

### Itens
- criar parâmetros de distribuição no plano
- registrar consumo por usuário/mês
- validar saldo antes de distribuir
- bloquear entrega quando a cota estiver esgotada
- exibir consumo por tipo de cota

### Critérios de aceite
- plano parametriza o comportamento da distribuição
- usuário com cota esgotada deixa de receber oportunidades conforme regra
- consumo é atualizado corretamente

---

## Contexto 7 — Admin de cotas e distribuição
### Objetivo
Dar visibilidade operacional e comercial ao admin.

### Itens
- criar menu “Cotas de Distribuição” no admin
- exibir visão por advogado
- exibir visão por plano
- mostrar consumo, saldo e limites
- permitir ajustes manuais controlados
- permitir consulta de histórico de consumo

### Critérios de aceite
- admin consegue acompanhar uso de cotas
- admin consegue entender o motivo da elegibilidade/não elegibilidade
- regras do plano ficam visíveis para gestão

---

## Contexto 8 — Auditoria e admin do chat
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

## Contexto 9 — Anexos no chat
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

# User stories adicionais

### US-SERVICE-EDIT-01
Como advogado que publicou um serviço, quero poder corrigir informações do serviço para manter a diligência atualizada.

### US-SERVICE-EDIT-02
Como correspondente que aceitou um serviço, quero ser avisado quando houver alteração relevante para não executar com informação desatualizada.

### US-DIST-01
Como administrador da plataforma, quero parametrizar regras de distribuição por plano para equilibrar performance, monetização e experiência.

### US-DIST-02
Como correspondente, quero receber oportunidades conforme meu plano e minha região, para que a distribuição seja justa e relevante.

### US-DIST-03
Como admin, quero acompanhar o consumo de cotas por advogado e por plano para ter governança operacional e comercial.

---

# Priorização sugerida

## Sprint / onda 1
- estrutura base do chat
- UI mínima do chat
- banner de segurança com link
- edição do serviço antes do aceite
- histórico de alteração pós-aceite

## Sprint / onda 2
- restrições refinadas de edição pós-aceite
- notificações por alteração relevante
- filtro elegível de distribuição
- parâmetros de distribuição no plano

## Sprint / onda 3
- cotas por usuário/mês
- loteamento da distribuição
- painel admin de cotas
- auditoria operacional da distribuição

## Sprint / onda 4
- anexos no chat
- reprocessamento de lotes
- leitura/não lidas
- score evolutivo de distribuição

---

# Pendências de decisão

- quais campos sensíveis poderão ser alterados após aceite
- alteração de data/local exigirá reaceite em fase futura ou apenas notificação
- qual será a unidade oficial de cota cobrada por plano
- distribuição será primeiro-aceite ou aceite mediante aprovação do publicador
- qual será a regra quando não houver aceite no lote inicial
- qual é a URL oficial da política de segurança

---

# Recomendação final

A melhor evolução do módulo é tratar esses três pontos como um único bloco operacional:
- **chat contextual e auditável**
- **edição controlada do serviço com trilha pós-aceite**
- **distribuição inteligente com cotas por plano**

Isso gera:
- governança
- previsibilidade comercial
- melhor performance
- aderência ao modelo de assinatura
- experiência mais profissional para os advogados

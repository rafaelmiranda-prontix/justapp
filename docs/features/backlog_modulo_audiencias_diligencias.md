# Backlog — Módulo Audiências e Diligências

## Visão do backlog
Este backlog organiza o desenvolvimento do módulo **Audiências e Diligências** no painel do advogado, cobrindo o MVP e preparando a base para evolução futura.

## Objetivo do módulo
Permitir que advogados publiquem audiências e diligências, que correspondentes aceitem a execução, e que a plataforma intermedie o fluxo operacional com histórico, chat, anexos, status e avaliação.

---

# Contexto 01 — Estrutura base do módulo

## Objetivo
Criar a estrutura inicial do módulo no painel do advogado, com navegação, permissões e bases técnicas para evolução.

## Épicos
- Criar item de menu no painel do advogado
- Criar rotas e páginas base do módulo
- Definir permissões por perfil
- Criar estrutura inicial de entidades e serviços

## Histórias

### US-001 — Acessar o módulo no painel
**Como** advogado  
**Quero** visualizar o módulo “Audiências e Diligências” no menu  
**Para** acessar as funcionalidades do produto

**Critérios de aceite**
- O menu deve aparecer no painel do advogado
- O item deve direcionar para a página inicial do módulo
- O item deve respeitar permissões de perfil

### US-002 — Estruturar rotas do módulo
**Como** sistema  
**Quero** possuir rotas organizadas para o módulo  
**Para** suportar as telas do fluxo

**Critérios de aceite**
- Devem existir rotas para dashboard, oportunidades, publicar serviço, histórico, perfil de correspondente e detalhe do serviço
- As rotas devem estar protegidas por autenticação

### US-003 — Controlar permissões por perfil
**Como** plataforma  
**Quero** diferenciar capacidades de solicitante, correspondente e admin  
**Para** garantir segurança e comportamento adequado

**Critérios de aceite**
- Advogado comum pode publicar serviços
- Correspondente ativo pode aceitar serviços
- Admin pode visualizar todos os serviços

---

# Contexto 02 — Perfil de correspondente

## Objetivo
Permitir que um advogado se cadastre como correspondente e informe sua área de atuação operacional.

## Épicos
- Ativação do perfil de correspondente
- Cadastro de regiões e tipos de serviço
- Gestão de disponibilidade e preferências

## Histórias

### US-004 — Ativar perfil de correspondente
**Como** advogado  
**Quero** ativar meu perfil como correspondente  
**Para** receber oportunidades de audiência e diligência

**Critérios de aceite**
- O advogado deve poder ativar ou desativar seu perfil
- O status deve ser salvo no sistema
- Apenas advogado validado pode ativar o perfil

### US-005 — Informar regiões de atuação
**Como** correspondente  
**Quero** cadastrar minhas regiões/comarcas/fóruns de atuação  
**Para** receber oportunidades aderentes à minha localização

**Critérios de aceite**
- O usuário deve informar cidade, região, comarca e/ou fórum
- O sistema deve salvar múltiplas regiões de atuação
- As regiões devem ser editáveis

### US-006 — Informar tipos de serviço aceitos
**Como** correspondente  
**Quero** selecionar os tipos de serviço que executo  
**Para** receber apenas oportunidades compatíveis

**Critérios de aceite**
- O usuário pode selecionar um ou mais tipos de serviço
- Os tipos devem incluir ao menos: audiência, protocolo, cópia, diligência em fórum, despacho e personalizado

### US-007 — Definir valor mínimo e disponibilidade
**Como** correspondente  
**Quero** informar valor mínimo e disponibilidade  
**Para** evitar propostas incompatíveis

**Critérios de aceite**
- O correspondente pode informar valor mínimo desejado
- O correspondente pode informar disponibilidade por dia/período
- As informações ficam visíveis no perfil interno

---

# Contexto 03 — Publicação de audiência ou diligência

## Objetivo
Permitir que o advogado publique uma necessidade operacional de forma padronizada.

## Épicos
- Formulário de criação
- Validação de dados
- Anexos iniciais

## Histórias

### US-008 — Publicar um serviço
**Como** advogado solicitante  
**Quero** publicar uma audiência ou diligência  
**Para** encontrar um correspondente para executar o serviço

**Critérios de aceite**
- O formulário deve conter tipo, título, descrição, data, horário, local, comarca/fórum, valor e prazo de aceite
- O serviço deve ser salvo com status “Publicado”
- O sistema deve registrar data de criação e usuário criador

### US-009 — Validar campos obrigatórios
**Como** plataforma  
**Quero** validar os campos mínimos da publicação  
**Para** garantir qualidade nas oportunidades

**Critérios de aceite**
- O sistema deve impedir publicação sem dados obrigatórios
- Mensagens de erro devem ser exibidas de forma clara

### US-010 — Anexar documentos à publicação
**Como** advogado solicitante  
**Quero** enviar anexos ao criar a publicação  
**Para** compartilhar documentos necessários ao correspondente

**Critérios de aceite**
- O sistema deve aceitar upload de anexos permitidos
- Os anexos devem ficar associados ao serviço
- O sistema deve registrar autor e data do upload

---

# Contexto 04 — Descoberta de oportunidades

## Objetivo
Permitir que correspondentes encontrem oportunidades relevantes.

## Épicos
- Listagem de oportunidades
- Filtros de busca
- Tela de detalhe

## Histórias

### US-011 — Ver oportunidades disponíveis
**Como** correspondente  
**Quero** visualizar as oportunidades abertas  
**Para** escolher serviços que posso executar

**Critérios de aceite**
- A listagem deve exibir tipo, local, data, horário, valor e status
- Apenas itens publicados e ainda não aceitos devem aparecer

### US-012 — Filtrar oportunidades
**Como** correspondente  
**Quero** filtrar oportunidades por local, tipo, data e valor  
**Para** encontrar rapidamente os serviços do meu interesse

**Critérios de aceite**
- Deve existir filtro por cidade, comarca/fórum, tipo de serviço, data e faixa de valor
- Os filtros devem funcionar em conjunto

### US-013 — Ver detalhe da oportunidade
**Como** correspondente  
**Quero** acessar os detalhes completos do serviço  
**Para** decidir se aceito ou não

**Critérios de aceite**
- A tela deve mostrar todas as informações cadastradas
- A tela deve exibir anexos disponíveis
- A tela deve ter ação de aceite

---

# Contexto 05 — Aceite e vinculação do correspondente

## Objetivo
Permitir que um correspondente assuma a execução do serviço.

## Épicos
- Aceite de oportunidade
- Bloqueio de múltiplos aceites
- Notificação ao solicitante

## Histórias

### US-014 — Aceitar uma oportunidade
**Como** correspondente  
**Quero** aceitar um serviço disponível  
**Para** executá-lo

**Critérios de aceite**
- Apenas correspondente ativo pode aceitar
- Após o aceite, o serviço deve mudar para status “Aceito”
- O correspondente deve ficar vinculado ao serviço

### US-015 — Impedir aceite duplicado
**Como** plataforma  
**Quero** impedir que dois correspondentes aceitem o mesmo serviço  
**Para** evitar conflito operacional

**Critérios de aceite**
- Um serviço aceito não pode mais ser aceito por outro usuário
- Caso haja concorrência simultânea, apenas um aceite deve prevalecer

### US-016 — Notificar o solicitante
**Como** advogado solicitante  
**Quero** ser avisado quando meu serviço for aceito  
**Para** acompanhar a contratação

**Critérios de aceite**
- O sistema deve gerar notificação interna para o solicitante
- A notificação deve conter identificação do serviço e do correspondente

---

# Contexto 06 — Comunicação entre as partes

## Objetivo
Criar um canal de comunicação dentro da plataforma após o aceite.

## Épicos
- Chat do serviço
- Histórico de mensagens
- Alertas de novas mensagens

## Histórias

### US-017 — Conversar no chat do serviço
**Como** solicitante ou correspondente  
**Quero** trocar mensagens dentro do serviço  
**Para** alinhar instruções, dúvidas e andamento

**Critérios de aceite**
- O chat só deve existir para serviços aceitos
- As mensagens devem ter autor, data e hora
- O histórico deve permanecer salvo

### US-018 — Ser avisado de novas mensagens
**Como** usuário do serviço  
**Quero** receber aviso de nova mensagem  
**Para** não perder atualizações importantes

**Critérios de aceite**
- O sistema deve exibir indicador visual de nova mensagem
- A notificação deve apontar para o serviço correto

---

# Contexto 07 — Execução e atualização de status

## Objetivo
Permitir acompanhamento operacional do serviço até sua conclusão.

## Épicos
- Transição de status
- Evidências de execução
- Trilhas de histórico

## Histórias

### US-019 — Atualizar andamento do serviço
**Como** correspondente  
**Quero** atualizar o status do serviço  
**Para** informar o progresso da execução

**Critérios de aceite**
- Os status possíveis devem incluir: Publicado, Aceito, Em andamento, Realizado, Aguardando validação, Concluído e Cancelado
- O sistema deve registrar o histórico da mudança

### US-020 — Enviar evidências da execução
**Como** correspondente  
**Quero** anexar relatório e documentos após executar o serviço  
**Para** comprovar a realização

**Critérios de aceite**
- O correspondente deve conseguir anexar arquivos após o aceite
- Os anexos devem ficar visíveis para o solicitante
- O upload deve registrar data e autor

### US-021 — Validar conclusão do serviço
**Como** advogado solicitante  
**Quero** confirmar que o serviço foi concluído  
**Para** encerrar a demanda

**Critérios de aceite**
- O solicitante deve poder marcar o serviço como concluído
- A conclusão deve ficar auditada
- O serviço deve aparecer como encerrado no histórico

---

# Contexto 08 — Histórico e consulta

## Objetivo
Dar visibilidade ao histórico operacional de cada usuário.

## Épicos
- Histórico do solicitante
- Histórico do correspondente
- Filtros por status

## Histórias

### US-022 — Ver minhas publicações
**Como** advogado solicitante  
**Quero** ver todos os serviços que publiquei  
**Para** acompanhar minhas demandas

**Critérios de aceite**
- A listagem deve mostrar status, data, local e correspondente vinculado quando houver
- Deve ser possível filtrar por status e período

### US-023 — Ver serviços aceitos
**Como** correspondente  
**Quero** ver os serviços que aceitei  
**Para** organizar minha atuação

**Critérios de aceite**
- A listagem deve mostrar status, data, local, valor e solicitante
- Deve ser possível filtrar por status e período

---

# Contexto 09 — Avaliação e reputação básica

## Objetivo
Criar reputação inicial para gerar confiança no ecossistema.

## Épicos
- Avaliação pós-serviço
- Exibição de nota média

## Histórias

### US-024 — Avaliar o correspondente
**Como** advogado solicitante  
**Quero** avaliar o correspondente após a conclusão  
**Para** registrar a qualidade do serviço prestado

**Critérios de aceite**
- A avaliação deve aceitar nota de 1 a 5
- Comentário deve ser opcional
- Só pode avaliar serviço concluído

### US-025 — Avaliar o solicitante
**Como** correspondente  
**Quero** avaliar o solicitante após a conclusão  
**Para** registrar a experiência de trabalho

**Critérios de aceite**
- A avaliação deve aceitar nota de 1 a 5
- Comentário deve ser opcional
- Só pode avaliar serviço concluído

### US-026 — Exibir reputação básica
**Como** usuário da plataforma  
**Quero** ver a nota média do correspondente  
**Para** aumentar confiança na contratação

**Critérios de aceite**
- O perfil do correspondente deve exibir nota média e quantidade de avaliações

---

# Contexto 10 — Administração e moderação

## Objetivo
Garantir capacidade operacional para acompanhamento interno e resolução de problemas.

## Épicos
- Painel administrativo
- Auditoria
- Intervenção manual

## Histórias

### US-027 — Consultar todos os serviços no admin
**Como** administrador  
**Quero** acessar a visão consolidada dos serviços  
**Para** acompanhar a operação

**Critérios de aceite**
- O admin deve conseguir listar todos os serviços
- Deve haver filtros por status, tipo, data e usuários envolvidos

### US-028 — Ver trilha de auditoria
**Como** administrador  
**Quero** consultar histórico de ações do serviço  
**Para** investigar problemas e disputas

**Critérios de aceite**
- O sistema deve registrar criação, aceite, anexos, mudanças de status e conclusão
- O admin deve conseguir visualizar esse histórico

### US-029 — Alterar status manualmente
**Como** administrador  
**Quero** intervir manualmente em serviços problemáticos  
**Para** manter a operação sob controle

**Critérios de aceite**
- O admin pode atualizar status com justificativa
- A alteração deve ficar auditada

---

# Contexto 11 — Notificações

## Objetivo
Manter usuários informados sobre eventos importantes.

## Épicos
- Notificações internas
- Eventos relevantes do fluxo

## Histórias

### US-030 — Receber notificações operacionais
**Como** usuário  
**Quero** receber notificações sobre mudanças relevantes  
**Para** agir no tempo correto

**Critérios de aceite**
- O sistema deve notificar em eventos como: publicação aceita, nova mensagem, mudança de status e conclusão pendente

---

# Contexto 12 — Base técnica e modelo de dados

## Objetivo
Preparar backend, banco e integrações internas para suportar o módulo.

## Épicos
- Modelagem de banco
- APIs do módulo
- Upload e segurança

## Itens técnicos
- Criar tabela/coleção `correspondent_profiles`
- Criar tabela/coleção `service_requests`
- Criar tabela/coleção `service_request_attachments`
- Criar tabela/coleção `service_messages`
- Criar tabela/coleção `service_status_history`
- Criar tabela/coleção `service_reviews`
- Criar endpoints para CRUD e transição de estados
- Implementar autorização por papel
- Implementar paginação e filtros
- Implementar storage seguro de anexos
- Implementar logs de auditoria

---

# Priorização sugerida

## Sprint 1
- Contexto 01 — Estrutura base do módulo
- Contexto 02 — Perfil de correspondente
- Contexto 03 — Publicação de audiência ou diligência

## Sprint 2
- Contexto 04 — Descoberta de oportunidades
- Contexto 05 — Aceite e vinculação do correspondente
- Contexto 06 — Comunicação entre as partes

## Sprint 3
- Contexto 07 — Execução e atualização de status
- Contexto 08 — Histórico e consulta
- Contexto 11 — Notificações

## Sprint 4
- Contexto 09 — Avaliação e reputação básica
- Contexto 10 — Administração e moderação
- Contexto 12 — Hardening técnico e ajustes finais

---

# Definição de pronto do MVP
O MVP estará pronto quando:
- o advogado conseguir ativar perfil de correspondente
- o advogado conseguir publicar um serviço
- o correspondente conseguir localizar e aceitar uma oportunidade
- as partes conseguirem conversar dentro do serviço
- o correspondente conseguir atualizar status e anexar evidências
- o solicitante conseguir concluir
- ambos conseguirem avaliar
- o admin conseguir acompanhar e intervir

---

# Próximo backlog recomendado após MVP
- sugestão automática de faixa de preço
- cálculo de deslocamento
- matching por proximidade
- agenda integrada
- pagamento intermediado
- comissão da plataforma
- carteira e repasse
- score de reputação avançado
- penalidade por cancelamento
- analytics operacionais por região

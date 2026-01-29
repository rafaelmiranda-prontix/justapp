# 📋 Checklist de Desenvolvimento - LegalMatch MVP

## ✅ Fase 0: Setup Inicial (COMPLETA)

### Infraestrutura Base
- [x] Next.js 14+ configurado
- [x] TypeScript strict mode
- [x] Tailwind CSS + PostCSS
- [x] ESLint + Prettier
- [x] Path aliases configurados
- [x] .gitignore atualizado

### Database
- [x] Prisma configurado
- [x] Schema completo (9 modelos)
- [x] Relações definidas
- [x] Índices otimizados
- [x] Seed data criado
- [x] PostgreSQL conectado

### Autenticação
- [x] NextAuth instalado
- [x] Configuração completa
- [x] Google OAuth preparado
- [x] Prisma Adapter
- [x] Session callbacks
- [x] TypeScript types

### Design System
- [x] shadcn/ui configurado
- [x] Componente: Button
- [x] Componente: Input
- [x] Componente: Label
- [x] Componente: Card
- [x] Componente: Toast
- [x] Sistema de cores (CSS vars)

### Hooks & Utils
- [x] use-toast
- [x] use-media-query
- [x] use-debounce
- [x] use-local-storage
- [x] Utilitários gerais
- [x] Cliente Prisma

### Documentação
- [x] README.md
- [x] SETUP_COMPLETO.md
- [x] ARCHITECTURE.md
- [x] COMANDOS_UTEIS.md
- [x] ESTRUTURA_PROJETO.md
- [x] GOOGLE_OAUTH_SETUP.md
- [x] SUMARIO_FASE_0.md

---

## 🚧 Fase 1: Core - Cadastro e Autenticação (EM ANDAMENTO)

### Setup OAuth
- [ ] Criar projeto no Google Cloud Console
- [ ] Configurar tela de consentimento
- [ ] Gerar Client ID e Secret
- [ ] Adicionar ao .env
- [ ] Testar autenticação

### Componentes de Formulário
- [ ] Form wrapper com React Hook Form
- [ ] Input com validação visual
- [ ] Select customizado
- [ ] Textarea
- [ ] Checkbox
- [ ] Radio group
- [ ] File upload

### Cadastro de Cidadão
- [ ] Página /signup/cidadao
- [ ] Formulário de registro
  - [ ] Nome completo
  - [ ] Email
  - [ ] Telefone (opcional)
  - [ ] Senha
- [ ] Validação com Zod
- [ ] API Route POST /api/users/cidadao
- [ ] Criação no banco
- [ ] Redirect para dashboard

### Cadastro de Advogado
- [ ] Página /signup/advogado
- [ ] Formulário de registro
  - [ ] Nome completo
  - [ ] Email
  - [ ] Telefone
  - [ ] Número OAB (validado)
  - [ ] Senha
- [ ] Validação de OAB
- [ ] API Route POST /api/users/advogado
- [ ] Criação no banco
- [ ] Redirect para completar perfil

### Login
- [ ] Página /signin
- [ ] Formulário de login
- [ ] Botão "Entrar com Google"
- [ ] Validação de credenciais
- [ ] Redirect baseado em role

### Perfil do Advogado
- [ ] Página /advogado/perfil
- [ ] Upload de foto
  - [ ] Preview
  - [ ] Crop (opcional)
  - [ ] Salvar no storage
- [ ] Formulário de dados
  - [ ] Bio
  - [ ] Preço consulta
  - [ ] Especialidades (multi-select)
  - [ ] Cidade/Estado
  - [ ] Raio de atuação
  - [ ] Aceita online
- [ ] API Route PATCH /api/advogado/perfil
- [ ] Atualização no banco

### Perfil do Cidadão
- [ ] Página /cidadao/perfil
- [ ] Formulário básico
  - [ ] Nome
  - [ ] Telefone
  - [ ] Cidade/Estado
- [ ] API Route PATCH /api/cidadao/perfil

### Geolocalização
- [ ] Input de endereço
- [ ] Autocomplete de cidades
- [ ] Conversão para lat/lng
- [ ] Salvar coordenadas

---

## 📅 Fase 2: Chat de Entrada e IA

### Interface de Chat
- [ ] Componente ChatMessage
- [ ] Componente ChatInput
- [ ] Componente ChatBubble
- [ ] Container de chat
- [ ] Auto-scroll
- [ ] Indicador de digitação

### Fluxo de Triagem
- [ ] Roteiro de perguntas
- [ ] State machine do chat
- [ ] Validação de respostas
- [ ] Coleta de dados mínimos

### Integração IA
- [ ] API Route POST /api/ai/analyze
- [ ] Prompt engineering
- [ ] OpenAI/Claude client
- [ ] Análise de texto
- [ ] Classificação de especialidade
- [ ] Extração de urgência
- [ ] Fallback rule-based

### Input de Áudio (Opcional)
- [ ] Botão de gravação
- [ ] Gravação de áudio
- [ ] Compressão (opus)
- [ ] Upload para servidor
- [ ] Transcrição (Web Speech API)
- [ ] Fallback: pedir texto

---

## 🔍 Fase 3: Matching e Busca

### Algoritmo de Matching
- [ ] Função de score
  - [ ] Especialidade (peso 40%)
  - [ ] Distância (peso 30%)
  - [ ] Avaliação (peso 20%)
  - [ ] Disponibilidade (peso 10%)
- [ ] Query otimizada
- [ ] Ordenação por score

### Geolocalização Avançada
- [ ] Integração OpenStreetMap
- [ ] Cálculo de distância (Haversine)
- [ ] Filtro por raio
- [ ] Cache de coordenadas

### Listagem de Advogados
- [ ] Página /casos/[id]/advogados
- [ ] Card de advogado
  - [ ] Foto
  - [ ] Nome
  - [ ] Especialidades
  - [ ] Cidade
  - [ ] Distância
  - [ ] Avaliação
  - [ ] Preço
- [ ] Ordenação
- [ ] Filtros
- [ ] Paginação

### Perfil Público
- [ ] Página /advogados/[id]
- [ ] Informações completas
- [ ] Avaliações
- [ ] Botão de contato

---

## 💬 Fase 4: Conexão e Comunicação

### Solicitação de Contato
- [ ] Botão "Quero falar"
- [ ] Confirmação
- [ ] API Route POST /api/matches
- [ ] Criar Match no banco
- [ ] Notificação para advogado

### Notificações
- [ ] Sistema de notificações
- [ ] Email templates
- [ ] SendGrid/Resend integração
- [ ] Notificação de novo lead
- [ ] Notificação de mensagem

### Chat In-App
- [ ] Página /chat/[matchId]
- [ ] Interface de chat
- [ ] Envio de mensagens
- [ ] Recebimento real-time (polling/SSE)
- [ ] Upload de anexos
  - [ ] Validação (20MB, PDF/imagem)
  - [ ] Preview
  - [ ] Download
- [ ] Marcação de lida
- [ ] Limites (2000 chars, 10 msgs/min)

### Dashboard Advogado
- [ ] Página /advogado/dashboard
- [ ] Leads recebidos
- [ ] Filtros (pendente/aceito/recusado)
- [ ] Botões aceitar/recusar
- [ ] Métricas
  - [ ] Total de leads
  - [ ] Taxa de conversão
  - [ ] Avaliação média

### Dashboard Cidadão
- [ ] Página /cidadao/dashboard
- [ ] Casos abertos
- [ ] Matches pendentes
- [ ] Conversas ativas
- [ ] Histórico

---

## 📊 Fase 5: Dashboard e Gestão

### Analytics
- [ ] Modelo de Analytics no Prisma
- [ ] Tracking de eventos
- [ ] Métricas por usuário
- [ ] Gráficos (Recharts)

### Sistema de Avaliação
- [ ] Componente de Rating (stars)
- [ ] Modal de avaliação
- [ ] API Route POST /api/avaliacoes
- [ ] Cálculo de média
- [ ] Exibição no perfil

### Painel Admin
- [ ] Página /admin
- [ ] Proteção de rota (middleware)
- [ ] Lista de advogados pendentes
- [ ] Aprovar/reprovar
- [ ] Moderação de conteúdo
- [ ] Analytics gerais

---

## 💳 Fase 6: Monetização

### Planos
- [ ] Definir limites por plano
  - [ ] FREE: 3 leads/mês
  - [ ] BASIC: 20 leads/mês
  - [ ] PREMIUM: ilimitado
- [ ] Modelo no Prisma (já existe)
- [ ] Lógica de verificação

### Stripe/Pagar.me
- [ ] Criar conta
- [ ] Configurar produtos
- [ ] API Keys no .env
- [ ] Stripe SDK
- [ ] Checkout page
- [ ] Webhooks
  - [ ] payment_succeeded
  - [ ] subscription_deleted
- [ ] Atualizar plano no banco

### Gestão de Assinatura
- [ ] Página /advogado/assinatura
- [ ] Upgrade/Downgrade
- [ ] Histórico de pagamentos
- [ ] Cancelamento

---

## 🎨 Fase 7: Polish e Deploy

### Performance
- [ ] Lazy loading de componentes
- [ ] Image optimization
- [ ] Code splitting
- [ ] React Query cache
- [ ] Memoização crítica

### SEO
- [ ] Metadata por página
- [ ] Open Graph tags
- [ ] Sitemap
- [ ] robots.txt
- [ ] Schema.org markup

### Testes
- [ ] Vitest setup
- [ ] Testes de hooks
- [ ] Testes de components
- [ ] Playwright E2E
- [ ] Coverage > 70%

### CI/CD
- [ ] GitHub Actions
- [ ] Lint no PR
- [ ] Type check no PR
- [ ] Build no PR
- [ ] Deploy automático

### Deploy
- [ ] Dockerfile
- [ ] Docker Compose
- [ ] Kubernetes manifests
- [ ] Ingress config
- [ ] SSL/TLS
- [ ] Deploy no VPS
- [ ] Monitoring (logs)

---

## 🧪 Fase 8: Validação

### Landing Page
- [ ] Hero section
- [ ] Features
- [ ] Como funciona
- [ ] Depoimentos
- [ ] CTA
- [ ] Footer

### Beta Testing
- [ ] Recrutamento de 10-20 advogados
- [ ] Onboarding manual
- [ ] Treinamento
- [ ] Coleta de feedback
- [ ] Ajustes

### Analytics
- [ ] PostHog/Plausible
- [ ] Eventos críticos
- [ ] Funis de conversão
- [ ] Heatmaps (opcional)

### Launch
- [ ] Soft launch (grupo fechado)
- [ ] Monitoramento de erros
- [ ] Hotfixes
- [ ] Marketing inicial
- [ ] Iteração baseada em feedback

---

## 📈 Métricas de Sucesso

### 3 Meses
- [ ] 500 cadastros de cidadãos
- [ ] 100 cadastros de advogados
- [ ] 200 matches realizados
- [ ] 30% de conversão (match → contato)
- [ ] NPS > 40
- [ ] 20 advogados pagantes

---

**Última atualização:** 29 de Janeiro de 2026
**Fase atual:** Fase 1 (Cadastro e Autenticação)
**Progresso geral:** 12.5% (1/8 fases)

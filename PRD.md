# PRD — LegalMatch (MVP)

> "Uber dos Processos" — Conectando pessoas com problemas jurídicos a advogados especializados.

---

## 1. Problema

### Para o Cidadão
- Não sabe se tem um caso jurídico válido
- Não sabe que tipo de advogado precisa
- Dificuldade em encontrar advogado confiável e próximo
- Medo de custos ocultos e processos complexos

### Para o Advogado
- Alto custo de aquisição de clientes
- Leads não qualificados (perda de tempo)
- Dificuldade em se diferenciar no mercado
- Dependência de indicações boca-a-boca

---

## 2. Solução

Plataforma que:
1. **Coleta** o problema do usuário de forma guiada
2. **Analisa** e classifica a demanda (área do direito, urgência, complexidade)
3. **Conecta** ao advogado mais adequado (especialidade + proximidade + avaliação)
4. **Facilita** o primeiro contato e acompanha até a contratação

---

## 3. Usuários-Alvo

| Persona | Descrição | Necessidade Principal |
|---------|-----------|----------------------|
| **Cidadão** | Pessoa física com problema jurídico (trabalhista, consumidor, família, etc.) | Encontrar advogado certo, rápido e confiável |
| **Advogado** | Profissional autônomo ou pequeno escritório | Leads qualificados na sua área/região |

---

## 4. Funcionalidades — MVP

### 4.1 App/Web Cidadão

| Feature | Descrição | Prioridade |
|---------|-----------|------------|
| **Onboarding guiado** | Questionário simples: "O que aconteceu?" → categorização automática | P0 |
| **Análise prévia** | Feedback: "Isso parece um caso de Direito do Consumidor" | P0 |
| **Match com advogados** | Lista de advogados compatíveis (área + localização) | P0 |
| **Perfil do advogado** | Foto, especialidades, avaliações, preço médio | P0 |
| **Solicitação de contato** | Botão "Quero falar com este advogado" | P0 |
| **Chat/Mensagens** | Comunicação in-app | P1 |
| **Avaliação pós-atendimento** | Rating + comentário | P1 |

### 4.2 App/Web Advogado

| Feature | Descrição | Prioridade |
|---------|-----------|------------|
| **Cadastro + verificação OAB** | Validação automática no site da OAB | P0 |
| **Perfil profissional** | Áreas de atuação, localização, bio, preços | P0 |
| **Receber leads** | Notificação de novos casos compatíveis | P0 |
| **Aceitar/Recusar caso** | Visualizar detalhes antes de aceitar | P0 |
| **Dashboard** | Métricas: leads recebidos, convertidos, avaliação | P1 |
| **Assinatura/Pagamento** | Gestão do plano | P1 |

### 4.3 Admin (interno)

| Feature | Descrição | Prioridade |
|---------|-----------|------------|
| **Moderação** | Aprovar advogados, revisar denúncias | P0 |
| **Analytics** | Métricas de uso, conversão, receita | P1 |

---

## 5. Fluxos Principais

### Fluxo do Cidadão
```
[Acessa app] 
    → [Descreve problema em linguagem simples]
    → [Sistema categoriza: área do direito + urgência]
    → [Exibe advogados compatíveis rankeados]
    → [Usuário seleciona advogado]
    → [Envia solicitação de contato]
    → [Advogado aceita → chat liberado]
    → [Pós-atendimento: avaliação]
```

### Fluxo do Advogado
```
[Cadastro + verificação OAB]
    → [Configura perfil + áreas de atuação]
    → [Escolhe plano (freemium ou premium)]
    → [Recebe notificação de lead]
    → [Visualiza detalhes do caso]
    → [Aceita ou recusa]
    → [Se aceita: chat com cidadão]
    → [Caso fechado: comissão aplicada]
```

---

## 6. Modelo de Negócio

| Fonte de Receita | Descrição |
|------------------|-----------|
| **Assinatura Advogado** | Plano mensal para receber leads (ex: R$99-299/mês) |
| **Comissão por caso** | % sobre o valor do contrato fechado via plataforma |
| **Freemium** | Advogado gratuito recebe X leads/mês, paga para mais |

### Projeção Inicial (validação)
- Meta: 50 advogados pagantes em 6 meses
- Ticket médio: R$150/mês
- MRR meta: R$7.500

---

## 7. Requisitos Técnicos

### Stack Recomendada (MVP)
| Camada | Tecnologia |
|--------|------------|
| Frontend Web | Next.js 14 (App Router) |
| Frontend Mobile | React Native + Expo (fase 2) |
| Backend | Node.js + Fastify |
| Banco de Dados | PostgreSQL + Prisma ORM |
| Auth | Clerk ou NextAuth |
| Storage | Cloudflare R2 ou S3 |
| Deploy | Vercel (front) + Railway (back) |
| Pagamentos | Stripe ou Pagar.me |

### Integrações
| Serviço | Uso |
|---------|-----|
| API OAB | Validação de registro do advogado |
| Google Maps | Geolocalização e cálculo de distância |
| OpenAI/Claude | Análise e categorização do problema jurídico |
| SendGrid/Resend | E-mails transacionais |
| OneSignal | Push notifications |

---

## 8. Métricas de Sucesso (MVP)

| Métrica | Meta (3 meses) |
|---------|----------------|
| Cadastros cidadão | 500 |
| Cadastros advogado | 100 |
| Matches realizados | 200 |
| Taxa de conversão (match → contato) | 30% |
| NPS | > 40 |
| Advogados pagantes | 20 |

---

## 9. Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| Advogados não pagam | Validar willingness to pay ANTES de construir |
| Baixa qualidade de leads | Melhorar questionário de triagem |
| Questões regulatórias (OAB) | Consultar advogado sobre compliance |
| Chicken-egg (poucos advogados = poucos usuários) | Começar em 1 cidade/nicho específico |

---

## 10. Roadmap MVP

| Fase | Duração | Entregas |
|------|---------|----------|
| **0. Validação** | 2 semanas | Landing page + 10 entrevistas com advogados |
| **1. Core** | 4 semanas | Cadastro + questionário + matching básico |
| **2. Conexão** | 2 semanas | Chat + notificações |
| **3. Monetização** | 2 semanas | Planos + pagamento |
| **4. Polish** | 2 semanas | Testes, ajustes, soft launch |

**Total MVP: ~10-12 semanas** (trabalhando part-time)

---

## 11. Fora do Escopo (MVP)

- App mobile nativo (começa web PWA)
- Múltiplos idiomas
- Integração com sistemas de escritório
- Marketplace de documentos jurídicos
- Videochamadas in-app

---

*Documento vivo — atualizar conforme validações*

**Criado:** 2026-01-29  
**Autor:** Gavyc + Rafa

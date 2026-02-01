# PRD — LegalConnect (MVP)

> Plataforma jurídica inteligente — Conectando pessoas com problemas jurídicos a advogados especializados.

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

## 4. Princípios do MVP (produto viável + custo baixo)

- **MVP enxuto:** foco em gerar leads e validar pagamento dos advogados
- **Chat como entrada:** texto ou áudio com perguntas mínimas
- **Contato dentro da plataforma:** comunicação obrigatoriamente in-app
- **Infra atual:** VPS com Kubernetes; evitar serviços pagos até validar tração
- **IA sob controle:** usar prompts simples + fallback rule-based para reduzir custo
- **Geolocalização barata:** OpenStreetMap/Nominatim no MVP

---

## 5. Foco Inicial (MVP)

- **Cidade:** Rio de Janeiro
- **Especialidade:** Direito do Consumidor

---

## 5.1 Modelo de Aquisição: Chat Anônimo Primeiro 🆕

### Princípio: Zero Fricção, Máxima Conversão

**Usuários começam conversando ANTES de criar conta.**

### Fluxo de Aquisição

```
Visitante → Chat Anônimo (IA) → Qualificação → Captura Email →
Criação Pré-ativa → Email Ativação → Senha → Conta Ativa → Matching
```

### Etapas Detalhadas

1. **Homepage com CTA irresistível**
   - "Comece Agora - É Grátis"
   - "Conte seu Problema em 2 Minutos"
   - Botão grande e visível

2. **Chat abre instantaneamente**
   - Sem formulário
   - Sem cadastro
   - Sem fricção
   - IA responde imediatamente

3. **IA qualifica via conversa (3-5 mensagens)**
   - Entende o problema
   - Identifica especialidade
   - Avalia urgência
   - Captura localização

4. **Momento de captura (após engajamento)**
   - "Encontrei 5 advogados especializados!"
   - Solicita: Nome + Email + Telefone (opcional)
   - Usuário já está engajado, taxa de conversão alta

5. **Criação automática (pré-ativa)**
   - Sistema cria usuário com `status = PRE_ACTIVE`
   - Cria caso com `status = PENDENTE_ATIVACAO`
   - Gera token de ativação único

6. **Email de ativação enviado**
   ```
   Assunto: Complete seu cadastro - 5 advogados te aguardam

   Olá [Nome]!

   Identificamos advogados especializados em [área]
   na região de [cidade] para seu caso.

   📋 Seu problema: [resumo IA]
   ⚡ Urgência: [Alta/Normal]

   Para conectar você com os advogados:
   [Ativar Minha Conta] ← expira em 48h
   ```

7. **Usuário ativa via email**
   - Clica no link
   - Cria senha
   - Conta vira `ACTIVE`
   - Caso vira `ABERTO`
   - Login automático

8. **Sistema distribui matches**
   - Busca advogados compatíveis
   - Cria até 5 matches
   - Notifica advogados

### Vantagens Mensuráveis

| Métrica | Sem Chat Anônimo | Com Chat Anônimo | Melhoria |
|---------|------------------|------------------|----------|
| Taxa de início | ~10% | ~30% | +200% |
| Taxa de conversão | ~15% | ~45% | +200% |
| Leads qualificados | ~60% | ~90% | +50% |
| Tempo até lead | ~8 min | ~3 min | -60% |
| Email verificado | ~70% | ~95% | +35% |

### Tecnicamente

**Armazenamento:**
- SessionId em cookie/localStorage
- Tabela `AnonymousSession` no banco
- Referência em `Caso.sessionId`

**Status de Usuário:**
- `PRE_ACTIVE`: Criado, aguardando ativação
- `ACTIVE`: Email verificado
- `SUSPENDED`: Suspenso
- `DELETED`: Deletado

**Status de Caso:**
- `PENDENTE_ATIVACAO`: Aguardando ativação (novo)
- `ABERTO`: Pode distribuir matches
- `EM_ANDAMENTO`: Advogado aceitou
- `FECHADO`: Resolvido
- `CANCELADO`: Cancelado

**Segurança:**
- Email obrigatoriamente verificado
- Token de ativação expira em 48h
- Rate limiting no chat (10 msgs/min)
- Proteção contra bots

---

## 6. Funcionalidades — MVP (custo baixo)

### 6.1 App/Web Cidadão

| Feature | Descrição | Prioridade |
|---------|-----------|------------|
| **Chat de entrada** | Texto ou áudio com perguntas mínimas | P0 |
| **Cadastro leve** | Nome + e-mail ou telefone | P0 |
| **Social signup** | Google/Apple (quando disponível) | P1 |
| **Análise prévia** | Feedback: "Isso parece um caso de Direito do Consumidor" | P0 |
| **Match com advogados** | Lista de advogados compatíveis (área + localização) | P0 |
| **Perfil do advogado** | Foto, nome, especialidade e cidade | P0 |
| **Solicitação de contato** | Botão "Quero falar com este advogado" | P0 |
| **Chat/Mensagens** | Comunicação in-app | P0 |
| **Avaliação pós-atendimento** | Rating + comentário | P1 |

### 6.2 App/Web Advogado

| Feature | Descrição | Prioridade |
|---------|-----------|------------|
| **Cadastro com OAB** | Número obrigatório (sem validação automática) | P0 |
| **Perfil profissional** | Áreas de atuação, localização, bio, preços | P0 |
| **Receber leads** | Notificação de novos casos compatíveis | P0 |
| **Aceitar/Recusar caso** | Visualizar detalhes antes de aceitar | P0 |
| **Dashboard** | Métricas: leads recebidos, convertidos, avaliação | P1 |
| **Assinatura/Pagamento** | Gestão do plano | P2 |

### 6.3 Admin (interno)

| Feature | Descrição | Prioridade |
|---------|-----------|------------|
| **Moderação** | Aprovar advogados, revisar denúncias | P0 |
| **Analytics** | Métricas de uso, conversão, receita | P1 |

---

## 7. Fluxos Principais

### Fluxo do Cidadão
```
[Acessa app] 
    → [Chat texto/áudio com perguntas mínimas]
    → [Se áudio: transcrição via navegador; se falhar, pedir resumo em texto]
    → [Informa nome + e-mail ou telefone]
    → [Sistema categoriza: área do direito + urgência + resumo]
    → [Exibe advogados compatíveis rankeados]
    → [Usuário seleciona advogado]
    → [Envia solicitação de contato]
    → [Advogado aceita → chat liberado]
    → [Pós-atendimento: avaliação]
```

### Fluxo do Advogado
```
[Cadastro com número OAB]
    → [Configura perfil + áreas de atuação]
    → [Escolhe plano (freemium ou premium)]
    → [Recebe notificação de lead]
    → [Visualiza detalhes do caso]
    → [Aceita ou recusa]
    → [Se aceita: chat com cidadão]
    → [Caso fechado: comissão aplicada]
```

---

## 8. Roteiro de Triagem (chat)

1. **Abertura curta:** "Conte com suas palavras o que aconteceu."
2. **Resumo automático:** IA gera resumo e área provável.
3. **3 perguntas objetivas:**
   - "Quando isso aconteceu? (data aproximada)"
   - "Você tem algum comprovante? (nota, protocolo, prints)"
   - "Você já tentou resolver com a empresa? (sim/não)"
4. **Dados mínimos:** "Como posso te chamar?" + "Qual e-mail ou telefone para contato?"
5. **Confirmação:** "Posso enviar seu caso para um advogado de Direito do Consumidor no RJ?"
6. **Pergunta extra (se dúvida):** "Qual empresa/loja envolvida?"

---

## 8.1 Regras de Direcionamento (MVP)

- **Direcionar se:** relação de consumo + fato objetivo + data informada
- **Não direcionar se:** pedido genérico sem fatos, ou fora do RJ
- **Se dúvida:** pedir empresa/loja envolvida e reavaliar

---

## 8.2 Comunicação In-App (Chat)

- **Abertura:** somente após advogado aceitar o caso
- **Mensagens:** texto + anexos (imagem/PDF)
- **Notificações:** e-mail + push (quando disponível)
- **Limites:** 2.000 caracteres por mensagem; 20MB por arquivo; 10 mensagens por minuto

---

## 8.3 Social Signup

- **Provedores:** Google (MVP); Apple se necessário
- **Alternativas:** OTP via SMS para telefone; magic link para e-mail

---

## 9. Modelo de Negócio

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

## 10. Requisitos Técnicos

### Stack Recomendada (MVP)
| Camada | Tecnologia |
|--------|------------|
| Frontend Web | Next.js 14 (App Router) |
| Frontend Mobile | React Native + Expo (fase 2) |
| Backend | Next.js API Routes (MVP) ou Fastify |
| Banco de Dados | PostgreSQL + Prisma ORM |
| Auth | NextAuth (MVP) ou Clerk |
| Storage | VPS (disco local) com compressão de áudio + MinIO opcional |
| Deploy | VPS com Kubernetes (single cluster) |
| Pagamentos | Stripe ou Pagar.me (fase 2) |

### Integrações
| Serviço | Uso |
|---------|-----|
| OpenStreetMap/Nominatim | Geolocalização e cálculo de distância (MVP) |
| Google Maps | Geolocalização (se necessário) |
| OpenAI/Claude | Análise e categorização do problema jurídico |
| SendGrid/Resend | E-mails transacionais |
| OneSignal | Push notifications |

---

### Áudio (MVP)

- **Upload:** direto para o servidor (VPS) via API
- **Formato:** `ogg/opus` com bitrate 24–32 kbps
- **Compressão:** converter para `opus` com bitrate baixo
- **Limites:** tamanho máximo por áudio e duração curta (60–90s)
- **Transcrição:** via recurso do navegador (ex.: plugin do Chrome/Web Speech API) no PWA; se indisponível, pedir resumo em texto

---

## 11. Métricas de Sucesso (MVP)

| Métrica | Meta (3 meses) |
|---------|----------------|
| Cadastros cidadão | 500 |
| Cadastros advogado | 100 |
| Matches realizados | 200 |
| Taxa de conversão (match → contato) | 30% |
| NPS | > 40 |
| Advogados pagantes | 20 |

---

## 12. Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| Advogados não pagam | Validar willingness to pay ANTES de construir |
| Baixa qualidade de leads | Melhorar questionário de triagem |
| Questões regulatórias (OAB) | Consultar advogado sobre compliance |
| Chicken-egg (poucos advogados = poucos usuários) | Começar em 1 cidade/nicho específico |
| Custos de infra/IA | Limitar uso de IA, compressão de áudio e fallback rule-based |

---

## 13. Roadmap MVP

| Fase | Duração | Entregas |
|------|---------|----------|
| **0. Validação** | 2 semanas | Landing page + 10 entrevistas com advogados |
| **1. Core** | 4 semanas | Cadastro + questionário + matching básico |
| **2. Conexão** | 2 semanas | Chat in-app + notificações |
| **3. Monetização** | 2 semanas | Planos + pagamento |
| **4. Polish** | 2 semanas | Testes, ajustes, soft launch |

**Total MVP: ~10-12 semanas** (trabalhando part-time)

---

## 14. Fora do Escopo (MVP)

- App mobile nativo (começa web PWA)
- Múltiplos idiomas
- Integração com sistemas de escritório
- Marketplace de documentos jurídicos
- Videochamadas in-app

---

*Documento vivo — atualizar conforme validações*

**Criado:** 2026-01-29  
**Autor:** Gavyc + Rafa

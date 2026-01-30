# Sprint 4: Sistema de Distribuição Automática de Casos - Implementation Summary

## Overview
Sprint 4 implementa o sistema completo de distribuição automática de casos para advogados, incluindo algoritmo de matching, notificações, aceitação/recusa de casos, e gerenciamento do ciclo de vida dos matches.

## What Was Implemented

### 1. Case Distribution Service
**File**: [src/lib/case-distribution.service.ts](src/lib/case-distribution.service.ts)

**Core Functionality**:
- **`distributeCase(casoId)`**: Distribui caso para advogados compatíveis
- **`findCompatibleLawyers()`**: Encontra advogados baseado em:
  - Especialidade match
  - Localização (mesmo estado/cidade)
  - Raio de atuação
  - Limite de leads mensais
  - Score mínimo configurável
- **`calculateMatchScore()`**: Calcula compatibilidade (0-100 pontos):
  - Especialidade: 0-40 pontos
  - Localização: 0-30 pontos
  - Urgência: 0-10 pontos
  - Histórico/Plano: 0-20 pontos
- **`calculateDistance()`**: Fórmula de Haversine para distância em KM
- **`expireOldMatches()`**: Expira matches pendentes que passaram do prazo
- **`resetMonthlyLeadCounters()`**: Reseta contadores mensais (FREE=3, BASIC=10, PREMIUM=50)

**Algorithm Flow**:
```typescript
1. Caso status = ABERTO
2. Sistema busca advogados:
   - Status ACTIVE
   - Onboarding completo
   - Não excedeu limite mensal
3. Calcula score para cada advogado
4. Filtra por score mínimo (default: 60)
5. Ordena por score (maior primeiro)
6. Cria até N matches (default: 5)
7. Define expiração (default: 48h)
8. Incrementa contador de leads
```

**Configuration Keys**:
- `max_matches_per_caso`: Máximo de advogados por caso (default: 5)
- `min_match_score`: Score mínimo para criar match (default: 60)
- `match_expiration_hours`: Horas para responder (default: 48)
- `auto_expire_matches`: Se deve expirar automaticamente (default: true)

### 2. Notification Service
**File**: [src/lib/notification.service.ts](src/lib/notification.service.ts)

**Email Templates**:

#### `notifyLawyerNewMatch(matchId)`
**When**: Match criado (caso distribuído)
**To**: Advogado
**Content**:
- Área de atuação
- Localização do cliente
- Urgência do caso
- Score de compatibilidade
- Distância em KM
- Data de expiração
- CTA: "Ver Detalhes e Responder"

#### `notifyCitizenMatchAccepted(matchId)`
**When**: Advogado aceita o caso
**To**: Cidadão
**Content**:
- Nome do advogado que aceitou
- CTA para iniciar conversa
- Link para dashboard

#### `notifyLawyerMatchExpiring(matchId)`
**When**: 6 horas antes de expirar
**To**: Advogado
**Content**:
- Alerta de expiração iminente
- Horas restantes
- CTA urgente para responder

**Features**:
- Beautiful HTML templates with gradients
- Responsive design
- Professional branding
- Non-blocking (doesn't fail main flow)

### 3. Match Management APIs

#### Accept Match
**Endpoint**: `POST /api/matches/[matchId]/accept`
**Auth**: ADVOGADO only
**Flow**:
1. Verifica ownership do match
2. Valida status (PENDENTE ou VISUALIZADO)
3. Verifica se não expirou
4. Atualiza match para ACEITO
5. Atualiza caso para EM_ANDAMENTO (se primeiro aceite)
6. Notifica cidadão
7. Libera chat entre ambos

**Response**:
```json
{
  "success": true,
  "data": {
    "matchId": "clx...",
    "status": "ACEITO",
    "respondidoEm": "2026-01-30T12:00:00Z"
  }
}
```

#### Reject Match
**Endpoint**: `POST /api/matches/[matchId]/reject`
**Auth**: ADVOGADO only
**Body**: `{ "motivo": "optional reason" }`
**Flow**:
1. Verifica ownership
2. Valida status
3. Atualiza match para RECUSADO
4. Log do motivo (se fornecido)
5. Match é arquivado
6. Cidadão NÃO é notificado (conforme regra de negócio)

#### Visualize Match
**Endpoint**: `POST /api/matches/[matchId]/visualize`
**Auth**: ADVOGADO only
**Flow**:
1. Marca match como VISUALIZADO na primeira abertura
2. Registra timestamp
3. Idempotente (não atualiza se já foi visualizado)

#### List Matches
**Endpoint**: `GET /api/matches?status=PENDENTE&limit=50&offset=0`
**Auth**: ADVOGADO or CIDADAO
**Query Params**:
- `status`: Filter by status
- `limit`: Pagination limit (default: 50)
- `offset`: Pagination offset (default: 0)

**Response**:
```json
{
  "success": true,
  "data": {
    "matches": [...],
    "pagination": {
      "total": 23,
      "limit": 50,
      "offset": 0,
      "hasMore": false
    },
    "stats": {
      "expiringSoon": 2,
      "pendente": 5,
      "visualizado": 3,
      "aceito": 10
    }
  }
}
```

### 4. Activation API Integration
**File**: [src/app/api/auth/activate/route.ts](src/app/api/auth/activate/route.ts)

**Updated Flow**:
```
User activates account
  ↓
Password is set → User becomes ACTIVE
  ↓
Cases move from PENDENTE_ATIVACAO → ABERTO
  ↓
CaseDistributionService.distributeCase() called (background)
  ↓
Matches created for each case
  ↓
NotificationService.notifyLawyerNewMatch() for each match
  ↓
Welcome email sent to user
```

**Important**: Distribution happens in background to not block user activation.

### 5. Cron Jobs

#### Expire Old Matches
**Endpoint**: `GET /api/cron/expire-matches`
**Schedule**: Every hour (`0 * * * *`)
**What it does**:
- Finds matches with status PENDENTE or VISUALIZADO
- Where `now() > expiresAt`
- Updates to EXPIRADO
- Returns count of expired matches

#### Reset Monthly Lead Counters
**Endpoint**: `GET /api/cron/reset-lead-counters`
**Schedule**: 1st day of month at midnight (`0 0 1 * *`)
**What it does**:
- Finds lawyers where last reset was 30+ days ago
- Resets `leadsRecebidosMes = 0`
- Updates `leadsLimiteMes` based on current plan:
  - FREE: 3
  - BASIC: 10
  - PREMIUM: 50
- Records reset timestamp

**Security**:
Both endpoints require `Authorization: Bearer {CRON_SECRET}` header.

**Vercel Cron Configuration**:
File: [vercel.json](vercel.json)
```json
{
  "crons": [
    {
      "path": "/api/cron/expire-matches",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/reset-lead-counters",
      "schedule": "0 0 1 * *"
    }
  ]
}
```

## Complete User Journey - Example

### Scenario: Maria (cidadã) needs a consumer rights lawyer

#### Step 1: Anonymous Chat & Activation
```
Maria: "Comprei um celular que veio com defeito"
  ↓ (pre-qualification completes)
Form: name=Maria Silva, email=maria@email.com
  ↓
User created (PRE_ACTIVE)
Caso created (PENDENTE_ATIVACAO)
  ↓
Activation email sent
  ↓
Maria clicks link, creates password
  ↓
User → ACTIVE
Caso → ABERTO
```

#### Step 2: Automatic Distribution
```
CaseDistributionService.distributeCase(caso.id)
  ↓
System searches lawyers:
  - Especialidade = "Direito do Consumidor"
  - Estado = "RJ"
  - leadsRecebidosMes < leadsLimiteMes
  ↓
Found 12 compatible lawyers
  ↓
Calculates scores:
  1. Dr. João (Score: 95) - Same city + specialty
  2. Dra. Ana (Score: 88) - Same state + specialty + premium
  3. Dr. Pedro (Score: 85) - Same state + specialty
  4. Dra. Clara (Score: 80) - Same state
  5. Dr. Lucas (Score: 75) - Same state
  ↓
Creates 5 matches (status: PENDENTE)
Expires in 48 hours
  ↓
Sends 5 emails to lawyers
Increments lead counters
```

#### Step 3: Lawyers Respond
```
Hour 2: Dr. João opens case
  → Match status: PENDENTE → VISUALIZADO

Hour 4: Dr. João accepts
  → Match status: VISUALIZADO → ACEITO
  → Caso status: ABERTO → EM_ANDAMENTO
  → Email sent to Maria
  → Chat unlocked

Hour 10: Dra. Ana accepts
  → Match status: ACEITO
  → Email sent to Maria
  → Maria now has 2 lawyers

Hour 48: Dr. Pedro, Dra. Clara, Dr. Lucas don't respond
  → Cron job runs
  → All 3 matches → EXPIRADO
  → Maria is NOT notified of rejections
```

#### Step 4: Maria Chooses
```
Maria chats with both Dr. João and Dra. Ana
  ↓
Decides to hire Dr. João
  ↓
Marks match as CONTRATADO
  ↓
Caso continues EM_ANDAMENTO
  ↓
Match with Dra. Ana stays ACEITO (backup)
```

## Match Status Flow

```
PENDENTE (created)
    ↓
    ├─→ VISUALIZADO (lawyer opens)
    │       ↓
    │       ├─→ ACEITO (lawyer accepts)
    │       │       ↓
    │       │       └─→ CONTRATADO (citizen chooses)
    │       │
    │       ├─→ RECUSADO (lawyer rejects)
    │       │
    │       └─→ EXPIRADO (48h passed)
    │
    ├─→ RECUSADO (lawyer rejects without opening)
    │
    └─→ EXPIRADO (48h passed without opening)
```

## Database Schema Relations

```
User (CIDADAO)
  ↓
Cidadao
  ↓
Caso (ABERTO)
  ↓
Match ←→ Advogado ←→ User (ADVOGADO)
  ↓
Mensagem (chat)
```

**Key Fields**:
- `Match.score`: Compatibilidade (0-100)
- `Match.distanciaKm`: Distância em KM
- `Match.status`: PENDENTE, VISUALIZADO, ACEITO, RECUSADO, EXPIRADO, CONTRATADO
- `Match.enviadoEm`: Criação
- `Match.visualizadoEm`: Primeira abertura
- `Match.respondidoEm`: Aceite ou recusa
- `Match.expiresAt`: Data de expiração

## Environment Variables

Add to `.env`:
```bash
# Cron Job Security
CRON_SECRET="your_secure_random_string_here"

# Email (already configured in Sprint 3)
RESEND_API_KEY="re_..."
EMAIL_FROM="LegalConnect <noreply@legalconnect.com>"

# App URL
NEXTAUTH_URL="http://localhost:3000"
```

## Testing the Distribution Flow

### 1. Setup Test Data
```sql
-- Create test lawyer
INSERT INTO users (email, name, role, status, password) VALUES
  ('lawyer@test.com', 'Dr. João Silva', 'ADVOGADO', 'ACTIVE', '$2b$10$...');

INSERT INTO advogados (userId, oab, cidade, estado, plano, leadsLimiteMes, onboardingCompleted) VALUES
  ('user_id', 'RJ123456', 'Rio de Janeiro', 'RJ', 'PREMIUM', 50, true);

-- Link speciality
INSERT INTO advogado_especialidades (advogadoId, especialidadeId) VALUES
  ('advogado_id', 'especialidade_consumidor_id');
```

### 2. Activate User Account
```bash
# User completes activation
POST /api/auth/activate
{
  "token": "activation_token",
  "password": "MyPassword123"
}
```

### 3. Check Console Logs
```bash
[Activate] User activated: clx... (maria@email.com)
[Activate] Cases activated: 1 case(s) moved to ABERTO
[Distribution] Starting distribution for case clx...
[Distribution] Especialidade: Direito do Consumidor
[Distribution] Localização: Rio de Janeiro, RJ
[Distribution] Found 3 compatible lawyers
[Distribution] Match created: clx... | Lawyer: clx... | Score: 95
[Distribution] Match created: clx... | Lawyer: clx... | Score: 85
[Distribution] Match created: clx... | Lawyer: clx... | Score: 75
[Distribution] Created 3 matches for case clx...
[Notification] New match email sent to lawyer@test.com
```

### 4. Lawyer Accepts Match
```bash
# Lawyer logs in and accepts
POST /api/matches/{matchId}/accept
Authorization: Bearer {lawyer_jwt}

# Response
{
  "success": true,
  "data": {
    "matchId": "clx...",
    "status": "ACEITO",
    "respondidoEm": "2026-01-30T12:00:00Z"
  }
}
```

### 5. Verify Notifications
```bash
[Match] Match clx... accepted by lawyer clx...
[Notification] Match accepted email sent to maria@email.com
```

## Score Calculation Examples

### Example 1: Perfect Match
```
Lawyer: Dr. João
- Especialidade: Direito do Consumidor (caso match) = +40
- Cidade: Rio de Janeiro (same) = +20 + 10 = +30
- Plano: PREMIUM + Urgência ALTA = +10
- Plano: PREMIUM = +15
Total: 95 points ✅
```

### Example 2: Good Match
```
Lawyer: Dra. Ana
- Especialidade: Direito Civil (não match exato) = +10
- Cidade: Niterói (estado RJ match) = +20
- Plano: BASIC = +5
- Plano: BASIC = +10
Total: 45 points ❌ (below minimum 60)
```

### Example 3: State Match
```
Lawyer: Dr. Pedro
- Especialidade: Direito do Consumidor = +40
- Estado: RJ (not same city) = +20
- Plano: FREE = +0
- Plano: FREE = +5
Total: 65 points ✅
```

## Monitoring & Metrics

### Logs to Monitor
```bash
# Distribution success
[Distribution] Created X matches for case Y

# Match responses
[Match] Match X accepted by lawyer Y
[Match] Match X rejected by lawyer Y

# Expirations
[Cron] Match expiration completed: X matches expired

# Monthly resets
[Cron] Lead counter reset completed: X lawyers reset

# Notifications
[Notification] New match email sent to X
[Notification] Match accepted email sent to X
```

### Key Metrics to Track
- **Distribution Rate**: Cases distributed / Total ABERTO cases
- **Match Acceptance Rate**: ACEITO / (ACEITO + RECUSADO + EXPIRADO)
- **Time to First Accept**: Average time from enviadoEm to first ACEITO
- **Expiration Rate**: EXPIRADO / Total matches
- **Conversion Rate**: CONTRATADO / ACEITO
- **Lawyer Response Time**: Average time from enviadoEm to respondidoEm

## Files Created/Modified

### Created:
- `src/lib/case-distribution.service.ts` - Core distribution algorithm
- `src/lib/notification.service.ts` - Email notifications
- `src/app/api/matches/[matchId]/accept/route.ts` - Accept endpoint
- `src/app/api/matches/[matchId]/reject/route.ts` - Reject endpoint
- `src/app/api/matches/[matchId]/visualize/route.ts` - Visualize endpoint
- `src/app/api/cron/expire-matches/route.ts` - Expiration cron
- `src/app/api/cron/reset-lead-counters/route.ts` - Reset cron
- `vercel.json` - Cron configuration
- `SPRINT_4_SUMMARY.md` - This file

### Modified:
- `src/app/api/auth/activate/route.ts` - Added distribution trigger

## Next Steps (Sprint 5)

1. **Chat System**
   - Real-time messaging between lawyer and citizen
   - Only after match is ACEITO
   - File attachments support
   - Typing indicators
   - Read receipts

2. **Lawyer Dashboard**
   - View all matches (pendente, visualizado, aceito)
   - Quick accept/reject buttons
   - Filters by status, urgency, speciality
   - Case details modal
   - Performance metrics

3. **Citizen Dashboard**
   - View case status
   - See which lawyers accepted
   - Chat with accepted lawyers
   - Mark lawyer as CONTRATADO
   - Request to close case

4. **Geolocation Enhancement**
   - Geocoding service integration
   - Automatic lat/long from address
   - Visual map of nearby lawyers
   - Distance-based sorting

5. **Analytics Dashboard (Admin)**
   - System-wide metrics
   - Lawyer performance tracking
   - Case funnel analysis
   - Revenue tracking

## Business Impact

### For Citizens:
- ✅ Automatic matching with qualified lawyers
- ✅ Multiple options to choose from
- ✅ No manual search required
- ✅ Transparent process
- ✅ Chat enabled after acceptance

### For Lawyers:
- ✅ Pre-qualified leads delivered automatically
- ✅ Full case context before accepting
- ✅ No upfront cost (only pay for plan)
- ✅ Fair distribution based on compatibility
- ✅ Respects monthly limits

### For Platform:
- ✅ Scalable distribution algorithm
- ✅ Automated workflow reduces overhead
- ✅ Monetization via lawyer plans
- ✅ High-quality matches increase conversion
- ✅ Complete audit trail

## Conclusion

Sprint 4 successfully implements the complete automatic case distribution system. The platform now:

1. ✅ Distributes cases automatically after user activation
2. ✅ Calculates compatibility scores intelligently
3. ✅ Respects lawyer limits and preferences
4. ✅ Sends professional email notifications
5. ✅ Allows lawyers to accept/reject within 48h
6. ✅ Notifies citizens when lawyers accept
7. ✅ Expires old matches automatically
8. ✅ Resets monthly counters

**The core marketplace mechanics are now functional!** 🚀

The system is ready for Sprint 5: Real-time Chat and Dashboard interfaces.

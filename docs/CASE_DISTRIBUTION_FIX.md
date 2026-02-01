# ✅ Fix: Distribuição de Casos

## 🔍 Problemas Identificados e Corrigidos

### 1. **Falta de Advogados no Sistema**
**Problema**: Não havia advogados ativos com onboarding completo no banco de dados.

**Critérios para um advogado receber casos**:
- `users.status = 'ACTIVE'`
- `advogados.onboardingCompleted = true`
- `advogados.leadsRecebidosMes < advogados.leadsLimiteMes`

**Solução**: Criado script de seed ([scripts/seed-lawyers.ts](scripts/seed-lawyers.ts)) que adiciona 4 advogados de teste:

```bash
npx tsx scripts/seed-lawyers.ts
```

**Advogados Criados**:
- **Dr. João Silva** - PREMIUM (50 leads/mês) - São Paulo, SP
  - Especialidades: Direito Civil, Direito Imobiliário
  - Login: joao.silva@advogado.com / senha123

- **Dra. Maria Santos** - BASIC (10 leads/mês) - Rio de Janeiro, RJ
  - Especialidades: Direito Trabalhista, Direito do Consumidor
  - Login: maria.santos@advogado.com / senha123

- **Dr. Carlos Oliveira** - BASIC (10 leads/mês) - Campinas, SP
  - Especialidade: Direito Penal
  - Login: carlos.oliveira@advogado.com / senha123

- **Dra. Ana Costa** - FREE (3 leads/mês) - Belo Horizonte, MG
  - Especialidade: Direito Civil
  - Login: ana.costa@advogado.com / senha123

---

### 2. **Erro no ConfigService**
**Problema**: O `CaseDistributionService` chamava métodos inexistentes:
```typescript
ConfigService.getNumber()  // ❌ Não existe
ConfigService.getBoolean() // ❌ Não existe
```

**Solução**: Corrigido para usar o método genérico correto:
```typescript
ConfigService.get<number>('chave', defaultValue)
ConfigService.get<boolean>('chave', defaultValue)
```

**Arquivo Corrigido**: [src/lib/case-distribution.service.ts](src/lib/case-distribution.service.ts:50)

---

### 3. **Casos sem Localização**
**Problema**: Casos criados sem `cidade` e `estado` não podiam ser matched quando advogados/cidadãos não têm coordenadas GPS.

**Lógica de Matching** (linha 199-203):
```typescript
if (
  caso.cidadaos.latitude &&
  caso.cidadaos.longitude &&
  advogado.latitude &&
  advogado.longitude
) {
  // Usa cálculo de distância GPS
} else {
  // Sem GPS, REQUER mesmo estado
  if (caso.cidadaos.estado !== advogado.estado) {
    continue // Não faz match
  }
}
```

**Solução**: Durante o chat anônimo, o sistema deve coletar cidade e estado do usuário. Por enquanto, criamos script para atualizar manualmente:

```bash
npx tsx scripts/update-case-location.ts
```

**Ação Futura**: Garantir que o `AnonymousSessionService` salve `cidade` e `estado` detectados e propague para o `Caso` quando criado.

---

## 🛠️ Scripts de Diagnóstico e Manutenção

### 1. **Verificar Estado da Distribuição**
Verifica advogados disponíveis, casos abertos e matches criados:

```bash
npx tsx scripts/check-distribution.ts
```

**Saída Esperada**:
```
📊 Advogados ATIVOS e COM ONBOARDING: 4
✅ Advogados disponíveis: [lista de advogados]
📋 Casos ABERTOS: X
🤝 Total de Matches: X
```

---

### 2. **Disparar Distribuição Manual**
Para casos ABERTOS que ainda não foram distribuídos:

```bash
npx tsx scripts/distribute-open-cases.ts
```

**Quando usar**:
- Após criar novos advogados
- Casos antigos que não foram distribuídos
- Testar o algoritmo de matching

---

### 3. **Criar Advogados de Teste**
Adiciona advogados com diferentes planos e especialidades:

```bash
npx tsx scripts/seed-lawyers.ts
```

---

### 4. **Atualizar Localização de Casos**
Para casos sem `cidade/estado`:

```bash
npx tsx scripts/update-case-location.ts
```

---

## 🔄 Fluxo de Distribuição Automática

### Quando a Distribuição é Disparada?

**No fluxo normal**:
1. Usuário completa chat anônimo
2. Submete dados (nome, email, telefone) → `/api/anonymous/convert`
3. Sistema cria:
   - User com `status: PRE_ACTIVE`
   - Cidadao com cidade/estado do chat
   - Caso com `status: PENDENTE_ATIVACAO`
4. Email de ativação é enviado
5. Usuário clica no link → `/api/auth/activate`
6. Sistema:
   - Atualiza User para `status: ACTIVE`
   - Atualiza Caso para `status: ABERTO`
   - **DISPARA** `CaseDistributionService.distributeCase()` em background
7. Distribuição cria matches e notifica advogados

**Código de Ativação** ([src/app/api/auth/activate/route.ts](src/app/api/auth/activate/route.ts:119)):
```typescript
CaseDistributionService.distributeCase(caso.id)
  .then(async (result) => {
    console.log(`Case ${caso.id} distributed: ${result.matchesCreated} matches created`)

    // Notificar advogados
    const matches = await prisma.matches.findMany({
      where: { casoId: caso.id, status: 'PENDENTE' },
    })

    for (const match of matches) {
      NotificationService.notifyLawyerNewMatch(match.id)
    }
  })
```

---

## 📊 Algoritmo de Scoring

O sistema calcula um score de 0-100 para cada par (caso, advogado):

### Fatores de Score (total 100 pontos):

1. **Especialidade (0-40 pontos)**:
   - Match perfeito (advogado tem a especialidade do caso): **+40 pts**
   - Sem match mas pode atender: **+10 pts**
   - Caso sem especialidade definida: **+20 pts**

2. **Localização (0-30 pontos)**:
   - Mesmo estado: **+20 pts**
   - Mesma cidade (bonus): **+10 pts**

3. **Urgência (0-10 pontos)**:
   - Caso URGENTE + Advogado PREMIUM: **+10 pts**
   - Caso URGENTE + Advogado BASIC: **+5 pts**

4. **Plano do Advogado (0-20 pontos)**:
   - PREMIUM: **+15 pts**
   - BASIC: **+10 pts**
   - FREE: **+5 pts**

### Critérios de Filtro:

Advogado é **descartado** se:
- Não está com `status: ACTIVE`
- Não completou onboarding (`onboardingCompleted: false`)
- Atingiu limite mensal (`leadsRecebidosMes >= leadsLimiteMes`)
- Score < 60 (configurável via `min_match_score`)
- Com coordenadas: Distância > `raioAtuacao`
- Sem coordenadas: Estado diferente

### Configurações:

- `max_matches_per_caso`: Quantos matches criar por caso (padrão: 5)
- `min_match_score`: Score mínimo para criar match (padrão: 60)
- `match_expiration_hours`: Horas até match expirar (padrão: 48)

---

## ✅ Status Atual

### ✅ Funcionando:
- [x] Advogados criados no sistema (4 advogados de teste)
- [x] ConfigService corrigido
- [x] Algoritmo de matching funcionando
- [x] Matches sendo criados com sucesso
- [x] Scripts de diagnóstico criados

### ⚠️ Atenções Futuras:

1. **ConfigService**: Os valores de configuração estão usando defaults hardcoded. Criar registros na tabela `configuracoes` para personalização:

```sql
INSERT INTO configuracoes (id, chave, valor, tipo, descricao, categoria) VALUES
  (gen_random_uuid(), 'max_matches_per_caso', '5', 'NUMBER', 'Máximo de matches por caso', 'matching'),
  (gen_random_uuid(), 'min_match_score', '60', 'NUMBER', 'Score mínimo para match', 'matching'),
  (gen_random_uuid(), 'match_expiration_hours', '48', 'NUMBER', 'Horas até match expirar', 'matching'),
  (gen_random_uuid(), 'auto_expire_matches', 'true', 'BOOLEAN', 'Expirar matches automaticamente', 'matching');
```

2. **Notificações**: Implementar `NotificationService.notifyLawyerNewMatch()` para enviar emails/push para advogados quando receberem matches.

3. **Cron Jobs**: Configurar tarefas agendadas:
   - `CaseDistributionService.expireOldMatches()` - Diariamente
   - `CaseDistributionService.resetMonthlyLeadCounters()` - Mensalmente (dia 1)

4. **Coleta de Localização**: Garantir que o chat anônimo sempre colete cidade/estado:
   - Via perguntas diretas
   - Via detecção por IP (GeoIP)
   - Via browser geolocation API

---

## 🧪 Testando o Fluxo Completo

### 1. Criar um Caso via Chat Anônimo

```bash
# 1. Abrir homepage
open http://localhost:3000

# 2. Abrir chat anônimo
# 3. Conversar sobre um problema jurídico
# 4. Submeter formulário com dados
# 5. Verificar email de ativação
# 6. Clicar no link de ativação
```

### 2. Verificar Matching

```bash
# Executar diagnóstico
npx tsx scripts/check-distribution.ts

# Deve mostrar:
# - Caso com status ABERTO
# - Matches criados (1-5 dependendo de advogados compatíveis)
# - Advogado(s) com leadsRecebidosMes incrementado
```

### 3. Login como Advogado

```
Email: joao.silva@advogado.com
Senha: senha123
```

Verificar que o match aparece no dashboard do advogado.

---

## 📝 Resumo Executivo

**Problema Original**: Casos não estavam sendo distribuídos para advogados.

**Causas Raiz**:
1. Banco de dados sem advogados ativos/completos
2. Bug no ConfigService (métodos incorretos)
3. Casos sem localização definida

**Soluções Implementadas**:
1. ✅ Script de seed para criar advogados de teste
2. ✅ Correção do ConfigService
3. ✅ Script para atualizar localização de casos
4. ✅ Scripts de diagnóstico e manutenção

**Status**: 🟢 Sistema de distribuição funcionando corretamente

**Próximos Passos**:
- Garantir coleta de localização no chat anônimo
- Implementar notificações para advogados
- Configurar cron jobs para expiração/reset
- Popular configurações no banco de dados

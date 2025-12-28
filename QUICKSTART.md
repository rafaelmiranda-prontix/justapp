# Guia de Início Rápido - LegalMatch

## 🚀 Começando em 5 Minutos

### Pré-requisitos

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- Flutter SDK >= 3.16.0
- Conta no Supabase (grátis)
- API Key da OpenAI

---

## 📋 Passo a Passo

### 1. Configurar Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um projeto
2. Vá em **Settings > Database** e copie a **Connection String**
3. Vá em **Settings > API** e copie:
   - **Project URL**
   - **anon public key**
   - **service_role key**
4. Vá em **Storage** e crie um bucket chamado `case-audios` (público)

### 2. Configurar Variáveis de Ambiente

Na raiz do projeto, crie um arquivo `.env`:

```bash
cp .env.example .env
```

Edite o `.env` com suas credenciais:

```env
# Supabase
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres"
SUPABASE_URL="https://[PROJECT-ID].supabase.co"
SUPABASE_ANON_KEY="eyJhbGc..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."

# OpenAI
OPENAI_API_KEY="sk-proj-..."

# JWT
JWT_SECRET="seu-secret-super-seguro-aqui"

# App
NODE_ENV="development"
PORT=3000
API_URL="http://localhost:3000"
SUPABASE_STORAGE_BUCKET="case-audios"
```

### 3. Instalar Dependências

Na raiz do projeto:

```bash
pnpm install
```

### 4. Configurar Banco de Dados

```bash
# Gerar Prisma Client
pnpm --filter api db:generate

# Executar migrations
pnpm --filter api db:migrate

# (Opcional) Abrir Prisma Studio para visualizar o banco
pnpm --filter api db:studio
```

### 5. Iniciar Backend

```bash
pnpm --filter api dev
```

Você verá:
```
✅ Database connected
🚀 Application is running on: http://localhost:3000/api
```

### 6. Testar API

Abra outro terminal e teste o endpoint de health:

```bash
curl http://localhost:3000/api/health
```

Resposta esperada:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "LegalMatch API",
  "version": "1.0.0"
}
```

### 7. Configurar Flutter

No arquivo `apps/mobile/lib/core/config/supabase_config.dart`, substitua os valores:

```dart
class SupabaseConfig {
  static const String url = 'https://[PROJECT-ID].supabase.co';
  static const String anonKey = 'eyJhbGc...';
  static const String storageBucket = 'case-audios';
}
```

No arquivo `apps/mobile/lib/core/config/api_config.dart`:

```dart
class ApiConfig {
  static const String baseUrl = 'http://localhost:3000/api';
  // Para testar em device físico, use o IP da sua máquina:
  // static const String baseUrl = 'http://192.168.1.X:3000/api';

  static const Duration timeout = Duration(seconds: 30);
}
```

### 8. Instalar Dependências Flutter

```bash
cd apps/mobile
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs
```

### 9. Rodar App Flutter

**Emulador/Simulador:**
```bash
flutter run
```

**Device físico (Android/iOS):**
```bash
# Conecte o device via USB e habilite debugging
flutter devices
flutter run -d [device-id]
```

---

## 🧪 Testando o Fluxo Completo

### 1. Criar Conta de Cliente

**Via API (cURL):**
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "cliente@test.com",
    "password": "senha123",
    "name": "João Cliente",
    "role": "CLIENT"
  }'
```

**Via App:**
- Escolha "Sou Cliente" → Preencha o formulário

### 2. Criar Caso

**Via API:**
```bash
# Primeiro, faça login para pegar o token
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "cliente@test.com",
    "password": "senha123"
  }'

# Use o access_token retornado
curl -X POST http://localhost:3000/api/cases \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [TOKEN]" \
  -d '{
    "rawText": "Fui demitido sem justa causa há 2 meses e não recebi minhas verbas rescisórias. Trabalhei por 3 anos na empresa XYZ."
  }'
```

A IA irá processar automaticamente e você verá o caso com status `OPEN` após alguns segundos.

### 3. Criar Conta de Advogado

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "advogado@test.com",
    "password": "senha123",
    "name": "Maria Advogada",
    "role": "LAWYER"
  }'
```

### 4. Criar Perfil de Advogado

```bash
# Login como advogado
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "advogado@test.com",
    "password": "senha123"
  }'

# Criar perfil
curl -X POST http://localhost:3000/api/lawyers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [TOKEN]" \
  -d '{
    "oabNumber": "123456",
    "oabState": "SP",
    "specialties": ["Direito do Trabalho", "Direito Civil"],
    "bio": "Advogada com 10 anos de experiência"
  }'
```

### 5. Adicionar Créditos ao Advogado

```bash
# Pegue o ID do lawyer do response anterior
curl -X POST http://localhost:3000/api/lawyers/[LAWYER_ID]/credits/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [TOKEN]" \
  -d '{
    "amount": 10
  }'
```

### 6. Ver Casos Disponíveis (Anonimizados)

```bash
curl -X GET http://localhost:3000/api/cases/open \
  -H "Authorization: Bearer [TOKEN]"
```

Você verá apenas:
- Categoria
- Subcategoria
- Resumo técnico (sem nomes, CPF, endereços)
- Urgência
- Confiança da IA

### 7. Advogado Aceitar Caso

```bash
curl -X POST http://localhost:3000/api/matches \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [TOKEN]" \
  -d '{
    "caseId": "[CASE_ID]"
  }'
```

Isso irá:
- Descontar 1 crédito do advogado
- Criar o match
- Mudar status do caso para `MATCHED`
- Advogado agora pode ver os dados completos do cliente

---

## 📱 Estrutura do App Mobile

O app está dividido em:

### Fluxo Cliente:
1. **Role Selection** → Escolher "Sou Cliente"
2. **Signup** → Criar conta
3. **Login** → Entrar
4. **Cases List** → Ver seus casos
5. **Create Case** → Criar novo caso (texto ou áudio)
6. **Case Details** → Ver detalhes e match

### Fluxo Advogado:
1. **Role Selection** → Escolher "Sou Advogado"
2. **Signup** → Criar conta
3. **Login** → Entrar
4. **Lawyer Profile Setup** → Configurar OAB e especialidades
5. **Cases Feed** → Ver casos disponíveis (anonimizados)
6. **Accept Case** → Aceitar caso (consome crédito)
7. **My Matches** → Ver casos aceitos (dados completos)

---

## 🐛 Troubleshooting

### Backend não conecta no banco:
- Verifique se a `DATABASE_URL` está correta
- Teste a conexão diretamente no Supabase Dashboard

### Erro "Prisma Client not generated":
```bash
pnpm --filter api db:generate
```

### Flutter não encontra packages:
```bash
cd apps/mobile
flutter clean
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs
```

### Erro de CORS no Flutter:
- Se testando em device físico, use o IP da máquina no `baseUrl`
- Configure CORS no backend (já está configurado)

### OpenAI API retorna erro 401:
- Verifique se a `OPENAI_API_KEY` está correta
- Confirme que tem créditos na conta OpenAI

---

## 📚 Próximos Passos

Agora que tudo está rodando:

1. ✅ **Implemente a gravação de áudio** no Flutter
2. ✅ **Complete as telas de listagem** de casos e advogados
3. ✅ **Adicione tratamento de erros** e loading states
4. ✅ **Implemente o sistema de notificações**
5. ✅ **Adicione testes** unitários e de integração

Consulte [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) para ver o que já foi feito e o que falta.

---

## 💡 Dicas

- Use o **Prisma Studio** para visualizar os dados: `pnpm --filter api db:studio`
- Use o **Flutter DevTools** para debug: `flutter run` → pressione `v`
- Monitore os logs da IA no console do backend
- Teste a anonimização criando casos com dados pessoais

---

**Está pronto para começar!** 🎉

Qualquer dúvida, consulte:
- [README.md](README.md) - Visão geral
- [PROJET_CONTEXT.md](PROJET_CONTEXT.md) - Contexto e regras de negócio
- [apps/api/README.md](apps/api/README.md) - Documentação da API
- [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) - Status da implementação

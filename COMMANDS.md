# Comandos Úteis - LegalMatch

## 🛠️ Desenvolvimento

### Backend (NestJS)

```bash
# Instalar dependências
pnpm install

# Desenvolvimento
pnpm --filter api dev

# Build produção
pnpm --filter api build

# Executar build
pnpm --filter api start

# Testes
pnpm --filter api test
pnpm --filter api test:watch
pnpm --filter api test:cov

# Lint
pnpm --filter api lint
```

### Prisma

```bash
# Gerar Prisma Client
pnpm --filter api db:generate

# Criar migration
pnpm --filter api db:migrate

# Push schema (sem migration)
pnpm --filter api db:push

# Abrir Prisma Studio
pnpm --filter api db:studio

# Reset database (CUIDADO!)
npx prisma migrate reset
```

### Frontend (Flutter)

```bash
# Instalar dependências
cd apps/mobile
flutter pub get

# Code generation (Riverpod)
flutter pub run build_runner build
flutter pub run build_runner build --delete-conflicting-outputs
flutter pub run build_runner watch

# Desenvolvimento
flutter run
flutter run -d chrome  # Web
flutter run -d <device-id>

# Build
flutter build apk --release
flutter build ios --release
flutter build web

# Testes
flutter test
flutter test --coverage

# Lint/Análise
flutter analyze

# Limpar
flutter clean
```

---

## 🧪 Testes de API (cURL)

### Auth

**Signup (Cliente):**
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

**Signup (Advogado):**
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

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "cliente@test.com",
    "password": "senha123"
  }'

# Salve o access_token retornado!
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Cases

**Criar caso (texto):**
```bash
curl -X POST http://localhost:3000/api/cases \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "rawText": "Fui demitido sem justa causa há 2 meses e não recebi minhas verbas rescisórias. Trabalhei por 3 anos na empresa XYZ como analista."
  }'
```

**Listar casos:**
```bash
# Todos os casos
curl -X GET http://localhost:3000/api/cases \
  -H "Authorization: Bearer $TOKEN"

# Filtrar por status
curl -X GET "http://localhost:3000/api/cases?status=OPEN" \
  -H "Authorization: Bearer $TOKEN"

# Casos abertos (advogado)
curl -X GET http://localhost:3000/api/cases/open \
  -H "Authorization: Bearer $TOKEN"
```

**Detalhes do caso:**
```bash
curl -X GET http://localhost:3000/api/cases/[CASE_ID] \
  -H "Authorization: Bearer $TOKEN"
```

### Lawyers

**Criar perfil:**
```bash
curl -X POST http://localhost:3000/api/lawyers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "oabNumber": "123456",
    "oabState": "SP",
    "specialties": ["Direito do Trabalho", "Direito Civil"],
    "bio": "Advogada com 10 anos de experiência"
  }'
```

**Listar advogados:**
```bash
curl -X GET http://localhost:3000/api/lawyers \
  -H "Authorization: Bearer $TOKEN"

# Filtrar por especialidade
curl -X GET "http://localhost:3000/api/lawyers?specialties=Direito%20do%20Trabalho" \
  -H "Authorization: Bearer $TOKEN"
```

**Adicionar créditos:**
```bash
curl -X POST http://localhost:3000/api/lawyers/[LAWYER_ID]/credits/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "amount": 10
  }'
```

### Matches

**Aceitar caso:**
```bash
curl -X POST http://localhost:3000/api/matches \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "caseId": "[CASE_ID]"
  }'
```

**Listar matches:**
```bash
curl -X GET http://localhost:3000/api/matches \
  -H "Authorization: Bearer $TOKEN"

# Por advogado
curl -X GET "http://localhost:3000/api/matches?lawyerId=[LAWYER_ID]" \
  -H "Authorization: Bearer $TOKEN"

# Por caso
curl -X GET "http://localhost:3000/api/matches?caseId=[CASE_ID]" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔍 Debug

### Backend

**Ver logs do Prisma:**
```bash
# .env
DATABASE_URL="postgresql://..."
DEBUG="prisma:*"
```

**Verificar conexão do banco:**
```bash
npx prisma db execute --stdin <<EOF
SELECT current_database();
EOF
```

### Flutter

**DevTools:**
```bash
flutter run
# Pressione 'v' no terminal para abrir DevTools
```

**Logs detalhados:**
```bash
flutter run -v
```

**Limpar cache:**
```bash
flutter clean
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs
```

---

## 📦 Supabase

### Storage (via CLI)

**Criar bucket:**
```bash
# Via Supabase Dashboard > Storage > New Bucket
# Nome: case-audios
# Public: Yes
```

**Policies (SQL):**
```sql
-- Permitir upload autenticado
CREATE POLICY "Users can upload their own files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'case-audios' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir leitura pública
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'case-audios');
```

### Database

**Ver tabelas:**
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';
```

**Ver casos recentes:**
```sql
SELECT id, "clientId", category, status, "createdAt"
FROM cases
ORDER BY "createdAt" DESC
LIMIT 10;
```

---

## 🚀 Deploy

### Backend (Railway)

```bash
# 1. Instalar Railway CLI
npm i -g @railway/cli

# 2. Login
railway login

# 3. Deploy
railway up

# 4. Configurar variáveis de ambiente
railway variables set DATABASE_URL=...
railway variables set OPENAI_API_KEY=...
```

### Flutter (Android)

```bash
# 1. Configurar signing
# Editar android/app/build.gradle

# 2. Build
flutter build apk --release

# 3. APK em: build/app/outputs/flutter-apk/app-release.apk

# 4. Upload para Play Console
```

### Flutter (iOS)

```bash
# 1. Abrir no Xcode
open ios/Runner.xcworkspace

# 2. Configurar signing & capabilities

# 3. Build
flutter build ios --release

# 4. Archive no Xcode

# 5. Upload para TestFlight
```

---

## 🧹 Manutenção

### Atualizar dependências

**Backend:**
```bash
pnpm update --latest
```

**Flutter:**
```bash
flutter pub upgrade
flutter pub outdated
```

### Limpar tudo

```bash
# Backend
pnpm --filter api clean

# Flutter
cd apps/mobile && flutter clean

# Root
rm -rf node_modules
pnpm install
```

---

## 📊 Monitoramento

### Logs de produção

```bash
# Railway
railway logs

# Heroku
heroku logs --tail -a legal-match-api
```

### Health check

```bash
curl http://localhost:3000/api/health

# Resposta esperada:
# {"status":"ok","timestamp":"...","service":"LegalMatch API","version":"1.0.0"}
```

---

## 🎯 Atalhos Úteis

```bash
# Rodar tudo em dev (root)
pnpm dev

# Instalar tudo
pnpm install

# Build tudo
pnpm build

# Limpar tudo
pnpm clean

# Lint tudo
pnpm lint
```

---

## 💡 Dicas

- Use `Prisma Studio` para ver/editar dados: `pnpm --filter api db:studio`
- Use `Flutter DevTools` para debug: pressione `v` quando `flutter run` estiver rodando
- Sempre teste em device físico para audio/camera (não funciona bem em simulador)
- Use `--verbose` nos comandos para debug: `flutter run --verbose`
- Mantenha `.env` atualizado e **NUNCA** commite ele no git

---

## 🔗 Links Úteis

- [Supabase Dashboard](https://supabase.com/dashboard)
- [OpenAI Platform](https://platform.openai.com)
- [Railway Dashboard](https://railway.app)
- [Prisma Docs](https://www.prisma.io/docs)
- [NestJS Docs](https://docs.nestjs.com)
- [Flutter Docs](https://docs.flutter.dev)
- [Riverpod Docs](https://riverpod.dev)

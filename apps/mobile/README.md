# LegalMatch Mobile App

App Flutter para conectar clientes com problemas jurídicos a advogados especialistas.

## 📱 Features

### Cliente
- ✅ Cadastro e login
- ✅ Criar caso (texto ou áudio)
- ✅ Gravar áudio com flutter_sound
- ✅ Ver lista de casos
- ✅ Acompanhar status (Analisando → Aguardando → Advogado encontrado)
- ✅ Ver categoria e urgência definidas pela IA

### Advogado
- ✅ Cadastro e login
- ✅ Ver casos disponíveis (dados anonimizados)
- ✅ Aceitar caso (consome 1 crédito)
- ✅ Ver confiança da IA e urgência

## 🏗️ Arquitetura

```
lib/
├── core/
│   ├── config/          # Configurações (API, Supabase)
│   ├── router/          # Go Router
│   ├── services/        # API, Storage, Audio
│   ├── providers/       # Riverpod providers
│   └── theme/           # Tema Material 3
├── features/
│   ├── auth/            # Login, Signup, Role Selection
│   ├── cases/           # Listagem e criação de casos
│   └── lawyers/         # Feed de casos para advogados
└── shared/
    ├── models/          # User, Case
    └── widgets/         # CaseCard
```

## 🚀 Começando

### Pré-requisitos

- Flutter SDK >= 3.16.0
- Dart SDK >= 3.2.0
- iOS: Xcode 15+
- Android: Android Studio + SDK 21+

### Instalação

```bash
# 1. Instalar dependências
flutter pub get

# 2. Code generation (Riverpod)
flutter pub run build_runner build --delete-conflicting-outputs

# 3. Rodar
flutter run
```

### Configuração

Defina as variáveis em tempo de build (recomendado). O app não inicia sem `SUPABASE_URL` e `SUPABASE_ANON_KEY`:

```bash
flutter run \
  --dart-define SUPABASE_URL=https://<projeto>.supabase.co \
  --dart-define SUPABASE_ANON_KEY=<sua-anon-key> \
  --dart-define API_URL=http://10.0.2.2:3000/api # use localhost no simulador iOS
```

Você também pode ajustar os valores padrão em `lib/core/config/api_config.dart` e `lib/core/config/supabase_config.dart` se preferir fixá-los no código.

#### Modo sem Supabase (dev)
- Rode com `--dart-define USE_SUPABASE=false --dart-define API_URL=http://10.0.2.2:3000/api`
- O app não inicializa o Supabase; login/signup usam apenas o backend (token vindo da API é guardado localmente).
- Upload de áudio fica desabilitado; envie texto ou adapte o backend para receber o arquivo por outro endpoint.

## 📦 Dependências Principais

```yaml
dependencies:
  flutter_riverpod: ^2.4.9    # State management
  go_router: ^13.0.0          # Navegação
  supabase_flutter: ^2.3.0    # Supabase client
  flutter_sound: ^9.2.13      # Gravação de áudio
  dio: ^5.4.0                 # HTTP client
  google_fonts: ^6.1.0        # Fontes
```

## 🎨 Telas

### Auth Flow
1. **Role Selection** - Escolher Cliente ou Advogado
2. **Signup** - Cadastro com validação
3. **Login** - Autenticação

### Cliente Flow
4. **Cases List** - Lista de casos criados
5. **Create Case** - Criar caso (texto + áudio)

### Advogado Flow
6. **Lawyers List** - Feed de casos disponíveis

## 🔊 Gravação de Áudio

O app usa `flutter_sound` para gravar áudio:

```dart
final audioService = ref.read(audioServiceProvider);

// Iniciar
await audioService.startRecording();

// Parar
await audioService.stopRecording();

// Cancelar
await audioService.cancelRecording();

// Stream de progresso
audioService.getRecordingStream()?.listen((event) {
  print(event.duration);
});
```

## 🌐 State Management

Usando Riverpod com code generation:

```dart
// Provider
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref.read(apiServiceProvider));
});

// Consumir
final authState = ref.watch(authProvider);
final user = authState.user;

// Ação
await ref.read(authProvider.notifier).signIn(email, password);
```

## 🔐 Permissões

### Android

Adicione ao `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO"/>
<uses-permission android:name="android.permission.INTERNET"/>
```

### iOS

Adicione ao `ios/Runner/Info.plist`:

```xml
<key>NSMicrophoneUsageDescription</key>
<string>Precisamos acessar o microfone para gravar seu relato</string>
```

## 📱 Build

### Android (APK)

```bash
flutter build apk --release
# Output: build/app/outputs/flutter-apk/app-release.apk
```

### iOS

```bash
flutter build ios --release
# Abra no Xcode para archive e distribuir
```

### ⚠️ Web

Este app é focado em **Android e iOS apenas**. Não há suporte para Web.

## 🧪 Testes

```bash
# Unit tests
flutter test

# Widget tests
flutter test test/widgets/

# Coverage
flutter test --coverage
```

## 🐛 Debug

```bash
# Ver logs detalhados
flutter run -v

# DevTools
flutter run
# Pressione 'v' no terminal

# Limpar e rebuildar
flutter clean
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs
flutter run
```

## 📊 Performance

- Use `const` constructors sempre que possível
- Evite rebuilds desnecessários com Riverpod
- Otimize listas com `ListView.builder`
- Cache de imagens com `cached_network_image`

## 🎯 Próximos Passos

- [ ] Tela de detalhes do caso
- [ ] Chat entre cliente e advogado
- [ ] Push notifications
- [ ] Offline support
- [ ] Tema escuro
- [ ] Testes de widget
- [ ] CI/CD

## 📚 Recursos

- [Flutter Docs](https://docs.flutter.dev)
- [Riverpod Docs](https://riverpod.dev)
- [Go Router Docs](https://pub.dev/packages/go_router)
- [Supabase Flutter](https://supabase.com/docs/reference/dart/introduction)
- [Flutter Sound](https://pub.dev/packages/flutter_sound)

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Add nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

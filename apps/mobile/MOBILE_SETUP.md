# Setup Mobile - Android & iOS

## 📱 Plataformas Suportadas

- ✅ **Android** (API 21+)
- ✅ **iOS** (iOS 12+)
- ❌ **Web** (não suportado)

---

## 🚀 Setup Rápido

### 1. Instalar dependências

```bash
cd apps/mobile
flutter pub get
```

### 2. Code generation (Riverpod)

```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

### 3. Configurar API e Supabase (obrigatório)

O app não inicia mais sem `SUPABASE_URL` e `SUPABASE_ANON_KEY`. Informe tudo via `--dart-define` (recomendado) para usar os defaults corretos por plataforma:

```bash
flutter run \
  --dart-define SUPABASE_URL=https://<projeto>.supabase.co \
  --dart-define SUPABASE_ANON_KEY=<sua-anon-key> \
  --dart-define API_URL=http://10.0.2.2:3000/api # use http://localhost:3000/api no simulador iOS
```

### 4. Rodar

```bash
# Android Emulator
flutter run

# iOS Simulator
flutter run -d iPhone

# Device físico
flutter devices
flutter run -d <device-id>
```

---

## 🤖 Android

### Requisitos

- Android Studio
- Android SDK (API 21+)
- Emulador ou device físico

### Permissões

O app requer:
- ✅ `INTERNET` - Para chamadas API
- ✅ `RECORD_AUDIO` - Para gravar áudio
- ✅ `WRITE_EXTERNAL_STORAGE` - Para salvar arquivos
- ✅ `READ_EXTERNAL_STORAGE` - Para ler arquivos

### Build APK

```bash
# Debug
flutter build apk

# Release
flutter build apk --release

# Output: build/app/outputs/flutter-apk/app-release.apk
```

### Bundle (Play Store)

```bash
flutter build appbundle --release

# Output: build/app/outputs/bundle/release/app-release.aab
```

### Configuração

- **Bundle ID**: `com.legalmatch.app`
- **Min SDK**: 21 (Android 5.0)
- **Target SDK**: 34 (Android 14)

---

## 🍎 iOS

### Requisitos

- macOS
- Xcode 15+
- CocoaPods
- Simulador ou device físico

### Permissões

O app solicita:
- ✅ Microfone - Para gravar áudio
- ✅ Fotos - Para anexar documentos
- ✅ Câmera - Para fotografar documentos

### Setup

```bash
cd ios
pod install
cd ..
```

### Build IPA

```bash
flutter build ios --release

# Abrir no Xcode para archive
open ios/Runner.xcworkspace
```

### Configuração

- **Bundle ID**: `com.legalmatch.app`
- **Min iOS**: 12.0
- **Team**: Configure no Xcode (Signing & Capabilities)

---

## 🔧 Configuração por Ambiente

### Desenvolvimento Local

```dart
// lib/core/config/api_config.dart
class ApiConfig {
  static const String baseUrl = 'http://10.0.2.2:3000/api'; // Android
  // static const String baseUrl = 'http://localhost:3000/api'; // iOS
}
```

### Device Físico

1. Encontre o IP da sua máquina:
   ```bash
   # macOS/Linux
   ifconfig | grep "inet "

   # Windows
   ipconfig
   ```

2. Use o IP no config:
   ```dart
   static const String baseUrl = 'http://192.168.1.X:3000/api';
   ```

### Produção

```dart
static const String baseUrl = 'https://api.legalmatch.com.br/api';
```

---

## 🧪 Testes

### Emulador Android

```bash
# Listar emuladores
flutter emulators

# Iniciar emulador
flutter emulators --launch <emulator-id>

# Rodar app
flutter run
```

### Simulador iOS

```bash
# Listar simuladores
xcrun simctl list devices

# Rodar app
flutter run -d "iPhone 15"
```

### Device Físico

```bash
# Android: Habilite "Depuração USB" nas configurações do desenvolvedor
# iOS: Conecte via cabo e confie no computador

# Listar devices
flutter devices

# Rodar
flutter run -d <device-id>
```

---

## 📦 Dependências Nativas

### Android

Adicionado automaticamente via Gradle:
- MultiDex
- AndroidX

### iOS

Requer CocoaPods:
```bash
cd ios
pod install
```

Principais pods:
- flutter_sound
- supabase_flutter
- path_provider

---

## 🐛 Troubleshooting

### Android

**Erro de permissão RECORD_AUDIO:**
- Certifique-se que o AndroidManifest.xml tem a permissão
- No emulador, aceite a permissão quando solicitado

**Erro de MultiDex:**
```bash
# Já configurado no build.gradle
multiDexEnabled true
```

**App não conecta na API:**
```dart
// Use 10.0.2.2 em vez de localhost
static const String baseUrl = 'http://10.0.2.2:3000/api';
```

### iOS

**Erro de CocoaPods:**
```bash
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
flutter clean
flutter run
```

**Erro de certificado:**
- Abra o Xcode
- Vá em Signing & Capabilities
- Selecione seu Team

**App não grava áudio:**
- Verifique se Info.plist tem NSMicrophoneUsageDescription
- No simulador, vá em Simulator > Features > Microphone

---

## 🚀 Deploy

### Android (Play Store)

1. Gerar keystore:
   ```bash
   keytool -genkey -v -keystore ~/upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
   ```

2. Configurar `android/key.properties`:
   ```properties
   storePassword=<password>
   keyPassword=<password>
   keyAlias=upload
   storeFile=<path-to-keystore>
   ```

3. Build bundle:
   ```bash
   flutter build appbundle --release
   ```

4. Upload no Play Console

### iOS (App Store)

1. Abrir Xcode:
   ```bash
   open ios/Runner.xcworkspace
   ```

2. Configurar:
   - Team
   - Bundle Identifier
   - Version & Build

3. Archive:
   - Product > Archive
   - Distribute App
   - Upload to TestFlight

---

## 📊 Performance

### Otimizações Aplicadas

- ✅ ProGuard (Android)
- ✅ Minify enabled
- ✅ Shrink resources
- ✅ MultiDex

### Tamanho do App

- **Android**: ~30-40 MB
- **iOS**: ~50-60 MB

### Tempo de Build

- **Debug**: ~30s
- **Release**: ~2-3 min

---

## 🔗 Links Úteis

- [Flutter Docs](https://docs.flutter.dev)
- [Android Developer](https://developer.android.com)
- [Apple Developer](https://developer.apple.com)
- [Play Console](https://play.google.com/console)
- [App Store Connect](https://appstoreconnect.apple.com)

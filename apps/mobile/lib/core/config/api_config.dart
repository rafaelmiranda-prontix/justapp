import 'dart:io';

class ApiConfig {
  static String get baseUrl {
    const envUrl = String.fromEnvironment('API_URL', defaultValue: '');
    if (envUrl.isNotEmpty) {
      return envUrl;
    }

    // Use emulator-safe default for Android, localhost for iOS/simulator.
    if (Platform.isIOS) {
      return 'http://localhost:3000/api';
    }
    return 'http://10.0.2.2:3000/api';
  }

  static const Duration timeout = Duration(seconds: 30);
}

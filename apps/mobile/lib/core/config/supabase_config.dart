class SupabaseConfig {
  static String get url => const String.fromEnvironment(
        'SUPABASE_URL',
        defaultValue: '',
      );

  static String get anonKey => const String.fromEnvironment(
        'SUPABASE_ANON_KEY',
        defaultValue: '',
      );

  static const String storageBucket = 'case-audios';

  static bool get isConfigured => url.isNotEmpty && anonKey.isNotEmpty;
}

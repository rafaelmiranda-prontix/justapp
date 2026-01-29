class SupabaseConfig {
  static bool get useSupabase =>
      const bool.fromEnvironment('USE_SUPABASE', defaultValue: true);

  static String get url => const String.fromEnvironment('SUPABASE_URL', defaultValue: '');

  static String get anonKey => const String.fromEnvironment('SUPABASE_ANON_KEY', defaultValue: '');

  static const String storageBucket = 'case-audios';

  static bool get isConfigured => !useSupabase || (url.isNotEmpty && anonKey.isNotEmpty);
}

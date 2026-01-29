import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'core/config/supabase_config.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  if (SupabaseConfig.useSupabase) {
    if (!SupabaseConfig.isConfigured) {
      runApp(
        const ConfigErrorApp(
          message:
              'Configuração do Supabase ausente. Defina SUPABASE_URL e SUPABASE_ANON_KEY via --dart-define ou desative com USE_SUPABASE=false.',
        ),
      );
      return;
    }

    // Initialize Supabase
    try {
      await Supabase.initialize(
        url: SupabaseConfig.url,
        anonKey: SupabaseConfig.anonKey,
      );
    } catch (error) {
      runApp(
        ConfigErrorApp(
          message: 'Falha ao inicializar o Supabase: $error',
        ),
      );
      return;
    }
  }

  runApp(
    const ProviderScope(
      child: LegalMatchApp(),
    ),
  );
}

class LegalMatchApp extends ConsumerWidget {
  const LegalMatchApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'LegalMatch',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      routerConfig: router,
    );
  }
}

class ConfigErrorApp extends StatelessWidget {
  final String message;

  const ConfigErrorApp({super.key, required this.message});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'LegalMatch - Configuração',
      home: Scaffold(
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Icon(Icons.warning_amber, size: 72, color: Colors.red),
                const SizedBox(height: 16),
                Text(
                  'Configuração pendente',
                  style: Theme.of(context).textTheme.headlineSmall,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),
                Text(
                  message,
                  style: Theme.of(context).textTheme.bodyLarge,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                const Text(
                  'Exemplo:',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                const SelectableText(
                  'flutter run '
                  '--dart-define SUPABASE_URL=https://<project>.supabase.co '
                  '--dart-define SUPABASE_ANON_KEY=<sua-anon-key> '
                  '--dart-define API_URL=http://10.0.2.2:3000/api',
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

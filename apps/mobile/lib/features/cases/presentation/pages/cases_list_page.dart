import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/providers/cases_provider.dart';
import '../../../../core/providers/auth_provider.dart';
import '../../../../shared/widgets/case_card.dart';

class CasesListPage extends ConsumerStatefulWidget {
  const CasesListPage({super.key});

  @override
  ConsumerState<CasesListPage> createState() => _CasesListPageState();
}

class _CasesListPageState extends ConsumerState<CasesListPage> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => _loadCases());
  }

  Future<void> _loadCases() async {
    final user = ref.read(authProvider).user;
    if (user != null) {
      await ref.read(casesProvider.notifier).fetchCases(clientId: user.id);
    }
  }

  @override
  Widget build(BuildContext context) {
    final casesState = ref.watch(casesProvider);
    final authState = ref.watch(authProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Meus Casos'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await ref.read(authProvider.notifier).signOut();
              if (context.mounted) {
                context.go('/login');
              }
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadCases,
        child: casesState.isLoading
            ? const Center(child: CircularProgressIndicator())
            : casesState.error != null
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.error_outline, size: 48, color: Colors.red),
                        const SizedBox(height: 16),
                        Text('Erro: ${casesState.error}'),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: _loadCases,
                          child: const Text('Tentar novamente'),
                        ),
                      ],
                    ),
                  )
                : casesState.cases.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.inbox, size: 80, color: Colors.grey[400]),
                            const SizedBox(height: 16),
                            Text(
                              'Nenhum caso criado ainda',
                              style: Theme.of(context).textTheme.titleLarge,
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Crie seu primeiro caso',
                              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                    color: Colors.grey[600],
                                  ),
                            ),
                            const SizedBox(height: 24),
                            ElevatedButton.icon(
                              onPressed: () => context.push('/cases/create'),
                              icon: const Icon(Icons.add),
                              label: const Text('Criar Caso'),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: casesState.cases.length,
                        itemBuilder: (context, index) {
                          final caseItem = casesState.cases[index];
                          return CaseCard(
                            caseModel: caseItem,
                            onTap: () {
                              // TODO: Navigate to case details
                            },
                          );
                        },
                      ),
      ),
      floatingActionButton: casesState.cases.isNotEmpty
          ? FloatingActionButton.extended(
              onPressed: () => context.push('/cases/create'),
              icon: const Icon(Icons.add),
              label: const Text('Novo Caso'),
            )
          : null,
    );
  }
}

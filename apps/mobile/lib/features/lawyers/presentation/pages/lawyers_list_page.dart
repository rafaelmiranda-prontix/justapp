import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/providers/open_cases_provider.dart';
import '../../../../core/providers/auth_provider.dart';

class LawyersListPage extends ConsumerStatefulWidget {
  const LawyersListPage({super.key});

  @override
  ConsumerState<LawyersListPage> createState() => _LawyersListPageState();
}

class _LawyersListPageState extends ConsumerState<LawyersListPage> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => _loadOpenCases());
  }

  Future<void> _loadOpenCases() async {
    await ref.read(openCasesProvider.notifier).fetchOpenCases();
  }

  Future<void> _acceptCase(String caseId) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Aceitar Caso'),
        content: const Text(
          'Ao aceitar este caso, 1 crédito será debitado da sua conta e você terá acesso aos dados completos do cliente.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Aceitar'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    try {
      await ref.read(openCasesProvider.notifier).acceptCase(caseId);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Caso aceito com sucesso!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erro ao aceitar caso: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final casesState = ref.watch(openCasesProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Casos Disponíveis'),
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
        onRefresh: _loadOpenCases,
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
                          onPressed: _loadOpenCases,
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
                              'Nenhum caso disponível',
                              style: Theme.of(context).textTheme.titleLarge,
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Aguarde novos casos',
                              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                    color: Colors.grey[600],
                                  ),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: casesState.cases.length,
                        itemBuilder: (context, index) {
                          final caseItem = casesState.cases[index];
                          return _OpenCaseCard(
                            caseModel: caseItem,
                            onAccept: () => _acceptCase(caseItem.id),
                          );
                        },
                      ),
      ),
    );
  }
}

class _OpenCaseCard extends StatelessWidget {
  final dynamic caseModel;
  final VoidCallback onAccept;

  const _OpenCaseCard({
    required this.caseModel,
    required this.onAccept,
  });

  Color _getUrgencyColor() {
    switch (caseModel.urgency) {
      case 'HIGH':
        return Colors.red;
      case 'MEDIUM':
        return Colors.orange;
      case 'LOW':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 3,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                // Urgency badge
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: _getUrgencyColor().withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: _getUrgencyColor()),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.priority_high,
                        size: 14,
                        color: _getUrgencyColor(),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        caseModel.urgencyLabel,
                        style: TextStyle(
                          color: _getUrgencyColor(),
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                const Spacer(),
                // AI Confidence
                if (caseModel.aiConfidence != null)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.blue[50],
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.smart_toy, size: 14, color: Colors.blue[700]),
                        const SizedBox(width: 4),
                        Text(
                          '${caseModel.aiConfidence}%',
                          style: TextStyle(
                            color: Colors.blue[700],
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 16),

            // Category
            if (caseModel.category != null) ...[
              Row(
                children: [
                  Icon(Icons.gavel, size: 18, color: Colors.grey[700]),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      caseModel.category!,
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                  ),
                ],
              ),
              if (caseModel.subCategory != null) ...[
                const SizedBox(height: 4),
                Padding(
                  padding: const EdgeInsets.only(left: 26),
                  child: Text(
                    caseModel.subCategory!,
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          color: Colors.grey[700],
                          fontWeight: FontWeight.w600,
                        ),
                  ),
                ),
              ],
              const SizedBox(height: 16),
            ],

            // Technical Summary (Anonymized)
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.lock, size: 14, color: Colors.grey[600]),
                      const SizedBox(width: 4),
                      Text(
                        'Resumo Técnico (Anonimizado)',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    caseModel.technicalSummary ?? 'Sem resumo disponível',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Accept button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: onAccept,
                icon: const Icon(Icons.check_circle),
                label: const Padding(
                  padding: EdgeInsets.symmetric(vertical: 12),
                  child: Text(
                    'Aceitar Caso (1 crédito)',
                    style: TextStyle(fontSize: 16),
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF10B981),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

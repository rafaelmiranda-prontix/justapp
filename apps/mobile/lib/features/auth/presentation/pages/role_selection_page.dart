import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class RoleSelectionPage extends StatelessWidget {
  const RoleSelectionPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.gavel,
                size: 80,
                color: Color(0xFF1E3A8A),
              ),
              const SizedBox(height: 24),
              Text(
                'LegalMatch',
                style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFF1E3A8A),
                    ),
              ),
              const SizedBox(height: 12),
              Text(
                'Conectando você ao advogado ideal',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: Colors.grey[600],
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 48),
              _RoleCard(
                icon: Icons.person,
                title: 'Sou Cliente',
                description: 'Preciso de ajuda jurídica',
                onTap: () => context.push('/signup?role=CLIENT'),
              ),
              const SizedBox(height: 16),
              _RoleCard(
                icon: Icons.work,
                title: 'Sou Advogado',
                description: 'Quero atender clientes',
                onTap: () => context.push('/signup?role=LAWYER'),
              ),
              const SizedBox(height: 32),
              TextButton(
                onPressed: () => context.push('/login'),
                child: const Text('Já tenho uma conta'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RoleCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;
  final VoidCallback onTap;

  const _RoleCard({
    required this.icon,
    required this.title,
    required this.description,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Row(
            children: [
              Icon(icon, size: 48, color: const Color(0xFF1E3A8A)),
              const SizedBox(width: 20),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      description,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: Colors.grey[600],
                          ),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.arrow_forward_ios),
            ],
          ),
        ),
      ),
    );
  }
}

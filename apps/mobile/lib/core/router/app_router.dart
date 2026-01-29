import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/auth/presentation/pages/login_page.dart';
import '../../features/auth/presentation/pages/signup_page.dart';
import '../../features/auth/presentation/pages/role_selection_page.dart';
import '../../features/cases/presentation/pages/cases_list_page.dart';
import '../../features/cases/presentation/pages/create_case_page.dart';
import '../../features/lawyers/presentation/pages/lawyers_list_page.dart';
import '../../features/cases/presentation/pages/anonymous_case_page.dart';

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/role-selection',
    routes: [
      GoRoute(
        path: '/role-selection',
        builder: (context, state) => const RoleSelectionPage(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => LoginPage(
          draftId: state.uri.queryParameters['draftId'],
        ),
      ),
      GoRoute(
        path: '/signup',
        builder: (context, state) => SignupPage(
          role: state.uri.queryParameters['role'] ?? 'CLIENT',
          draftId: state.uri.queryParameters['draftId'],
        ),
      ),
      GoRoute(
        path: '/cases',
        builder: (context, state) => const CasesListPage(),
      ),
      GoRoute(
        path: '/cases/create',
        builder: (context, state) => const CreateCasePage(),
      ),
      GoRoute(
        path: '/cases/anonymous',
        builder: (context, state) => const AnonymousCasePage(),
      ),
      GoRoute(
        path: '/lawyers',
        builder: (context, state) => const LawyersListPage(),
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      body: Center(
        child: Text('Page not found: ${state.uri}'),
      ),
    ),
  );
});

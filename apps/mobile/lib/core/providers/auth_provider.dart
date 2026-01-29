import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../shared/models/user_model.dart';
import '../services/api_service.dart';
import '../config/supabase_config.dart';

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref.read(apiServiceProvider));
});

class AuthState {
  final UserModel? user;
  final String? token;
  final bool isLoading;
  final String? error;

  AuthState({
    this.user,
    this.token,
    this.isLoading = false,
    this.error,
  });

  AuthState copyWith({
    UserModel? user,
    String? token,
    bool? isLoading,
    String? error,
  }) {
    return AuthState(
      user: user ?? this.user,
      token: token ?? this.token,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }

  bool get isAuthenticated => user != null && token != null;
}

class AuthNotifier extends StateNotifier<AuthState> {
  final ApiService _apiService;

  AuthNotifier(this._apiService) : super(AuthState()) {
    _checkSession();
  }

  Future<void> _checkSession() async {
    if (!SupabaseConfig.useSupabase) return;

    final session = Supabase.instance.client.auth.currentSession;
    if (session == null) return;

    // TODO: Fetch user data from API
    state = state.copyWith(
      token: session.accessToken,
      isLoading: false,
    );
    _apiService.setAuthToken(session.accessToken);
  }

  Future<void> signUp({
    required String email,
    required String password,
    required String name,
    required String role,
  }) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await _apiService.signUp(
        email: email,
        password: password,
        name: name,
        role: role,
      );

      final user = UserModel.fromJson(response['user']);
      final token = response['access_token'];

      state = state.copyWith(
        user: user,
        token: token,
        isLoading: false,
      );
      _apiService.setAuthToken(token);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
      rethrow;
    }
  }

  Future<void> signIn({
    required String email,
    required String password,
  }) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await _apiService.signIn(
        email: email,
        password: password,
      );

      final user = UserModel.fromJson(response['user']);
      final token = response['access_token'];

      state = state.copyWith(
        user: user,
        token: token,
        isLoading: false,
      );
      _apiService.setAuthToken(token);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
      rethrow;
    }
  }

  Future<void> signOut() async {
    if (SupabaseConfig.useSupabase) {
      await Supabase.instance.client.auth.signOut();
    }
    _apiService.setAuthToken(null);
    state = AuthState();
  }
}

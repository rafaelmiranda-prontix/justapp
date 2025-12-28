import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../config/api_config.dart';

final apiServiceProvider = Provider<ApiService>((ref) {
  return ApiService();
});

class ApiService {
  late final Dio _dio;
  final _supabase = Supabase.instance.client;

  ApiService() {
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiConfig.baseUrl,
        connectTimeout: ApiConfig.timeout,
        receiveTimeout: ApiConfig.timeout,
        headers: {
          'Content-Type': 'application/json',
        },
      ),
    );

    // Add interceptor to include auth token
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final session = _supabase.auth.currentSession;
          if (session != null) {
            options.headers['Authorization'] = 'Bearer ${session.accessToken}';
          }
          return handler.next(options);
        },
        onError: (error, handler) {
          print('API Error: ${error.message}');
          return handler.next(error);
        },
      ),
    );
  }

  // Auth
  Future<Map<String, dynamic>> signUp({
    required String email,
    required String password,
    required String name,
    required String role,
  }) async {
    final response = await _dio.post('/auth/signup', data: {
      'email': email,
      'password': password,
      'name': name,
      'role': role,
    });
    return response.data;
  }

  Future<Map<String, dynamic>> signIn({
    required String email,
    required String password,
  }) async {
    final response = await _dio.post('/auth/signin', data: {
      'email': email,
      'password': password,
    });
    return response.data;
  }

  // Cases
  Future<Map<String, dynamic>> createCase({
    String? rawText,
    String? audioUrl,
  }) async {
    final response = await _dio.post('/cases', data: {
      if (rawText != null) 'rawText': rawText,
      if (audioUrl != null) 'audioUrl': audioUrl,
    });
    return response.data;
  }

  Future<List<dynamic>> getCases({
    String? status,
    String? category,
    String? clientId,
  }) async {
    final response = await _dio.get('/cases', queryParameters: {
      if (status != null) 'status': status,
      if (category != null) 'category': category,
      if (clientId != null) 'clientId': clientId,
    });
    return response.data;
  }

  Future<List<dynamic>> getOpenCases({List<String>? specialties}) async {
    final response = await _dio.get('/cases/open', queryParameters: {
      if (specialties != null && specialties.isNotEmpty)
        'specialties': specialties.join(','),
    });
    return response.data;
  }

  Future<Map<String, dynamic>> getCaseById(String id) async {
    final response = await _dio.get('/cases/$id');
    return response.data;
  }

  // Lawyers
  Future<Map<String, dynamic>> createLawyerProfile({
    required String oabNumber,
    required String oabState,
    required List<String> specialties,
    String? bio,
  }) async {
    final response = await _dio.post('/lawyers', data: {
      'oabNumber': oabNumber,
      'oabState': oabState,
      'specialties': specialties,
      if (bio != null) 'bio': bio,
    });
    return response.data;
  }

  Future<List<dynamic>> getLawyers({List<String>? specialties}) async {
    final response = await _dio.get('/lawyers', queryParameters: {
      if (specialties != null && specialties.isNotEmpty)
        'specialties': specialties.join(','),
    });
    return response.data;
  }

  // Matches
  Future<Map<String, dynamic>> createMatch(String caseId) async {
    final response = await _dio.post('/matches', data: {
      'caseId': caseId,
    });
    return response.data;
  }

  Future<List<dynamic>> getMatches({
    String? lawyerId,
    String? caseId,
  }) async {
    final response = await _dio.get('/matches', queryParameters: {
      if (lawyerId != null) 'lawyerId': lawyerId,
      if (caseId != null) 'caseId': caseId,
    });
    return response.data;
  }
}

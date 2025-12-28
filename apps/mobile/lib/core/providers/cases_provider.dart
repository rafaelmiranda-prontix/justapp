import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../shared/models/case_model.dart';
import '../services/api_service.dart';

final casesProvider = StateNotifierProvider<CasesNotifier, CasesState>((ref) {
  return CasesNotifier(ref.read(apiServiceProvider));
});

class CasesState {
  final List<CaseModel> cases;
  final bool isLoading;
  final String? error;

  CasesState({
    this.cases = const [],
    this.isLoading = false,
    this.error,
  });

  CasesState copyWith({
    List<CaseModel>? cases,
    bool? isLoading,
    String? error,
  }) {
    return CasesState(
      cases: cases ?? this.cases,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class CasesNotifier extends StateNotifier<CasesState> {
  final ApiService _apiService;

  CasesNotifier(this._apiService) : super(CasesState());

  Future<void> fetchCases({String? status, String? clientId}) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await _apiService.getCases(
        status: status,
        clientId: clientId,
      );

      final cases = response.map((json) => CaseModel.fromJson(json)).toList();

      state = state.copyWith(
        cases: cases,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  Future<CaseModel> createCase({
    String? rawText,
    String? audioUrl,
  }) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await _apiService.createCase(
        rawText: rawText,
        audioUrl: audioUrl,
      );

      final newCase = CaseModel.fromJson(response);

      state = state.copyWith(
        cases: [newCase, ...state.cases],
        isLoading: false,
      );

      return newCase;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
      rethrow;
    }
  }

  Future<CaseModel> getCaseById(String id) async {
    try {
      final response = await _apiService.getCaseById(id);
      return CaseModel.fromJson(response);
    } catch (e) {
      rethrow;
    }
  }
}

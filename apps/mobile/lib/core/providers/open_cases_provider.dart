import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../shared/models/case_model.dart';
import '../services/api_service.dart';

final openCasesProvider = StateNotifierProvider<OpenCasesNotifier, OpenCasesState>((ref) {
  return OpenCasesNotifier(ref.read(apiServiceProvider));
});

class OpenCasesState {
  final List<CaseModel> cases;
  final bool isLoading;
  final String? error;

  OpenCasesState({
    this.cases = const [],
    this.isLoading = false,
    this.error,
  });

  OpenCasesState copyWith({
    List<CaseModel>? cases,
    bool? isLoading,
    String? error,
  }) {
    return OpenCasesState(
      cases: cases ?? this.cases,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class OpenCasesNotifier extends StateNotifier<OpenCasesState> {
  final ApiService _apiService;

  OpenCasesNotifier(this._apiService) : super(OpenCasesState());

  Future<void> fetchOpenCases({List<String>? specialties}) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await _apiService.getOpenCases(specialties: specialties);
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

  Future<void> acceptCase(String caseId) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      await _apiService.createMatch(caseId);

      // Remove case from list
      state = state.copyWith(
        cases: state.cases.where((c) => c.id != caseId).toList(),
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
      rethrow;
    }
  }
}

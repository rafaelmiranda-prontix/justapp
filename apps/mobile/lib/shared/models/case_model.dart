class CaseModel {
  final String id;
  final String clientId;
  final String? rawText;
  final String? audioUrl;
  final String? category;
  final String? subCategory;
  final String? technicalSummary;
  final String urgency;
  final int? aiConfidence;
  final String status;
  final DateTime createdAt;
  final DateTime updatedAt;

  CaseModel({
    required this.id,
    required this.clientId,
    this.rawText,
    this.audioUrl,
    this.category,
    this.subCategory,
    this.technicalSummary,
    required this.urgency,
    this.aiConfidence,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
  });

  factory CaseModel.fromJson(Map<String, dynamic> json) {
    return CaseModel(
      id: json['id'],
      clientId: json['clientId'],
      rawText: json['rawText'],
      audioUrl: json['audioUrl'],
      category: json['category'],
      subCategory: json['subCategory'],
      technicalSummary: json['technicalSummary'],
      urgency: json['urgency'] ?? 'MEDIUM',
      aiConfidence: json['aiConfidence'],
      status: json['status'],
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  String get statusLabel {
    switch (status) {
      case 'PENDING_ANALYSIS':
        return 'Analisando...';
      case 'OPEN':
        return 'Aguardando advogado';
      case 'MATCHED':
        return 'Advogado encontrado';
      case 'CLOSED':
        return 'Encerrado';
      case 'ARCHIVED':
        return 'Arquivado';
      default:
        return status;
    }
  }

  String get urgencyLabel {
    switch (urgency) {
      case 'LOW':
        return 'Baixa';
      case 'MEDIUM':
        return 'Média';
      case 'HIGH':
        return 'Alta';
      default:
        return urgency;
    }
  }
}

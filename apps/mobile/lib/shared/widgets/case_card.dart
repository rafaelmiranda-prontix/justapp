import 'package:flutter/material.dart';
import '../models/case_model.dart';
import 'package:intl/intl.dart';

class CaseCard extends StatelessWidget {
  final CaseModel caseModel;
  final VoidCallback? onTap;

  const CaseCard({
    super.key,
    required this.caseModel,
    this.onTap,
  });

  Color _getStatusColor() {
    switch (caseModel.status) {
      case 'PENDING_ANALYSIS':
        return Colors.orange;
      case 'OPEN':
        return Colors.blue;
      case 'MATCHED':
        return Colors.green;
      case 'CLOSED':
        return Colors.grey;
      case 'ARCHIVED':
        return Colors.grey;
      default:
        return Colors.grey;
    }
  }

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
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  // Status badge
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: _getStatusColor().withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: _getStatusColor()),
                    ),
                    child: Text(
                      caseModel.statusLabel,
                      style: TextStyle(
                        color: _getStatusColor(),
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  // Urgency badge
                  if (caseModel.urgency.isNotEmpty)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: _getUrgencyColor().withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
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
                  Text(
                    DateFormat('dd/MM/yyyy').format(caseModel.createdAt),
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.grey[600],
                        ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Category
              if (caseModel.category != null) ...[
                Row(
                  children: [
                    Icon(Icons.gavel, size: 16, color: Colors.grey[600]),
                    const SizedBox(width: 4),
                    Text(
                      caseModel.category!,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                  ],
                ),
                if (caseModel.subCategory != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    caseModel.subCategory!,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.grey[700],
                        ),
                  ),
                ],
                const SizedBox(height: 8),
              ],

              // Summary or raw text
              if (caseModel.technicalSummary != null)
                Text(
                  caseModel.technicalSummary!,
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodyMedium,
                )
              else if (caseModel.rawText != null)
                Text(
                  caseModel.rawText!,
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodyMedium,
                )
              else if (caseModel.audioUrl != null)
                Row(
                  children: [
                    Icon(Icons.audiotrack, size: 16, color: Colors.grey[600]),
                    const SizedBox(width: 4),
                    Text(
                      'Áudio anexado',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: Colors.grey[600],
                            fontStyle: FontStyle.italic,
                          ),
                    ),
                  ],
                ),

              // AI Confidence
              if (caseModel.aiConfidence != null) ...[
                const SizedBox(height: 12),
                LinearProgressIndicator(
                  value: caseModel.aiConfidence! / 100,
                  backgroundColor: Colors.grey[200],
                  valueColor: AlwaysStoppedAnimation<Color>(
                    caseModel.aiConfidence! > 70
                        ? Colors.green
                        : caseModel.aiConfidence! > 40
                            ? Colors.orange
                            : Colors.red,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Confiança da IA: ${caseModel.aiConfidence}%',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.grey[600],
                      ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

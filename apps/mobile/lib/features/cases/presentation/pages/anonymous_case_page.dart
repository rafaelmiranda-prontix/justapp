import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/services/api_service.dart';
import '../../../../core/services/audio_service.dart';
import '../../../../core/services/storage_service.dart';
import '../../../../core/config/supabase_config.dart';

class AnonymousCasePage extends ConsumerStatefulWidget {
  const AnonymousCasePage({super.key});

  @override
  ConsumerState<AnonymousCasePage> createState() => _AnonymousCasePageState();
}

class _AnonymousCasePageState extends ConsumerState<AnonymousCasePage> {
  final _formKey = GlobalKey<FormState>();
  final _textController = TextEditingController();
  final _proofTypesController = TextEditingController();
  final _desiredOutcomeController = TextEditingController();
  bool _isRecording = false;
  bool _hasRecording = false;
  String? _recordingPath;
  Duration _recordingDuration = Duration.zero;
  bool _hasProofs = false;
  bool _hasContract = false;
  bool _contacted = false;
  String? _urgency;
  bool _isSubmitting = false;
  String? _draftId;

  @override
  void dispose() {
    _textController.dispose();
    _proofTypesController.dispose();
    _desiredOutcomeController.dispose();
    super.dispose();
  }

  Future<void> _startRecording() async {
    try {
      final audioService = ref.read(audioServiceProvider);
      final path = await audioService.startRecording();
      setState(() {
        _isRecording = true;
        _recordingPath = path;
        _recordingDuration = Duration.zero;
      });
      audioService.getRecordingStream()?.listen((event) {
        if (mounted && _isRecording) {
          setState(() {
            _recordingDuration = event.duration;
          });
        }
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erro ao iniciar gravação: $e')),
        );
      }
    }
  }

  Future<void> _stopRecording() async {
    try {
      final audioService = ref.read(audioServiceProvider);
      await audioService.stopRecording();
      setState(() {
        _isRecording = false;
        _hasRecording = true;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erro ao parar gravação: $e')),
        );
      }
    }
  }

  Future<void> _cancelRecording() async {
    final audioService = ref.read(audioServiceProvider);
    await audioService.cancelRecording();
    setState(() {
      _isRecording = false;
      _hasRecording = false;
      _recordingPath = null;
      _recordingDuration = Duration.zero;
    });
  }

  void _onRecordStart() {
    if (_isRecording) return;
    _startRecording();
  }

  void _onRecordEnd() {
    if (_isRecording) {
      _stopRecording();
    }
  }

  void _onRecordCancel() {
    if (_isRecording) {
      _cancelRecording();
    }
  }

  String _formatDuration(Duration duration) {
    final minutes = duration.inMinutes.remainder(60).toString().padLeft(2, '0');
    final seconds = duration.inSeconds.remainder(60).toString().padLeft(2, '0');
    return '$minutes:$seconds';
  }

  Future<void> _submitDraft() async {
    if (!_formKey.currentState!.validate()) return;
    if (_textController.text.trim().isEmpty && !_hasRecording) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Digite o problema ou grave um áudio.')),
      );
      return;
    }
    setState(() => _isSubmitting = true);

    try {
      String? audioUrl;
      if (_hasRecording && _recordingPath != null) {
        if (!SupabaseConfig.useSupabase) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Upload de áudio requer Supabase.')),
          );
        } else {
          final storage = ref.read(storageServiceProvider);
          audioUrl = await storage.uploadAudio(File(_recordingPath!));
        }
      }

      final api = ref.read(apiServiceProvider);
      final response = await api.createDraft(
        rawText: _textController.text.trim().isEmpty ? null : _textController.text.trim(),
        audioUrl: audioUrl,
        hasProofs: _hasProofs,
        proofTypes: _proofTypesController.text.trim().isEmpty ? null : _proofTypesController.text.trim(),
        hasContract: _hasContract,
        contactedParty: _contacted,
        desiredOutcome: _desiredOutcomeController.text.trim().isEmpty ? null : _desiredOutcomeController.text.trim(),
        urgency: _urgency,
      );

      setState(() {
        _draftId = response['draftId'] as String?;
      });

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(response['message'] ?? 'Relato enviado.')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erro ao enviar relato: $e')),
      );
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  void _goToLogin() {
    if (_draftId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Envie o relato antes de continuar.')),
      );
      return;
    }
    context.push('/login?draftId=$_draftId');
  }

  void _goToSignup() {
    if (_draftId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Envie o relato antes de continuar.')),
      );
      return;
    }
    context.push('/signup?role=CLIENT&draftId=$_draftId');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Descrever problema (sem login)'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Conte seu problema',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _textController,
                  maxLines: 6,
                  decoration: const InputDecoration(
                    labelText: 'Descrição do problema (opcional se gravar áudio)',
                    hintText: 'Relate o que aconteceu...',
                  ),
                  validator: (value) {
                    return null; // validamos no submit
                  },
                ),
                const SizedBox(height: 16),
                const Divider(),
                const SizedBox(height: 12),
                Text(
                  'Ou grave um áudio',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                if (_isRecording) ...[
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.red[50],
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.red),
                    ),
                    child: Column(
                      children: [
                        const Icon(Icons.mic, size: 36, color: Colors.red),
                        const SizedBox(height: 8),
                        Text(
                          _formatDuration(_recordingDuration),
                          style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.red),
                        ),
                        const SizedBox(height: 4),
                        const Text('Gravando...'),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: _cancelRecording,
                          icon: const Icon(Icons.delete),
                          label: const Text('Cancelar'),
                          style: OutlinedButton.styleFrom(foregroundColor: Colors.red),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: _stopRecording,
                          icon: const Icon(Icons.stop),
                          label: const Text('Parar'),
                          style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                        ),
                      ),
                    ],
                  ),
                ] else if (_hasRecording) ...[
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.green[50],
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.green),
                    ),
                    child: Column(
                      children: [
                        const Icon(Icons.check_circle, size: 36, color: Colors.green),
                        const SizedBox(height: 8),
                        Text(_formatDuration(_recordingDuration), style: const TextStyle(fontWeight: FontWeight.bold)),
                        const SizedBox(height: 4),
                        const Text('Áudio gravado'),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),
                  OutlinedButton.icon(
                    onPressed: _cancelRecording,
                    icon: const Icon(Icons.refresh),
                    label: const Text('Gravar novamente'),
                  ),
                ] else ...[
                  GestureDetector(
                    onLongPressStart: (_) => _onRecordStart(),
                    onLongPressEnd: (_) => _onRecordEnd(),
                    onLongPressCancel: _onRecordCancel,
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 16),
                      decoration: BoxDecoration(
                        color: Colors.grey[200],
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.grey[400]!),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: const [
                          Icon(Icons.mic, color: Colors.black87),
                          SizedBox(width: 8),
                          Text('Segure para gravar áudio'),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Segure o botão para gravar, solte para parar. Use áudio se preferir falar em vez de digitar.',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.grey[600]),
                  ),
                ],
                const SizedBox(height: 16),
                SwitchListTile(
                  title: const Text('Você tem provas?'),
                  value: _hasProofs,
                  onChanged: (v) => setState(() => _hasProofs = v),
                ),
                if (_hasProofs) ...[
                  TextFormField(
                    controller: _proofTypesController,
                    maxLines: 2,
                    decoration: const InputDecoration(
                      labelText: 'Quais provas?',
                      hintText: 'Ex: mensagens, e-mails, fotos...',
                    ),
                  ),
                  const SizedBox(height: 12),
                ],
                SwitchListTile(
                  title: const Text('Existe contrato?'),
                  value: _hasContract,
                  onChanged: (v) => setState(() => _hasContract = v),
                ),
                SwitchListTile(
                  title: const Text('Já falou com a outra parte?'),
                  value: _contacted,
                  onChanged: (v) => setState(() => _contacted = v),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: _urgency,
                  decoration: const InputDecoration(labelText: 'Urgência'),
                  items: const [
                    DropdownMenuItem(value: 'LOW', child: Text('Baixa')),
                    DropdownMenuItem(value: 'MEDIUM', child: Text('Média')),
                    DropdownMenuItem(value: 'HIGH', child: Text('Alta')),
                  ],
                  onChanged: (v) => setState(() => _urgency = v),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _desiredOutcomeController,
                  maxLines: 3,
                  decoration: const InputDecoration(
                    labelText: 'O que você espera resolver?',
                    hintText: 'Ex: receber valores, rescindir contrato, etc.',
                  ),
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: _isSubmitting ? null : _submitDraft,
                  child: _isSubmitting
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation(Colors.white)),
                        )
                      : const Text('Enviar relato'),
                ),
                const SizedBox(height: 16),
                if (_draftId != null) ...[
                  Card(
                    color: Colors.green[50],
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Relato recebido!',
                            style: TextStyle(fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 8),
                          const Text('Crie sua conta para receber avaliação de um especialista.'),
                          const SizedBox(height: 12),
                          ElevatedButton(
                            onPressed: _goToLogin,
                            child: const Text('Já tenho conta'),
                          ),
                          TextButton(
                            onPressed: _goToSignup,
                            child: const Text('Criar conta para avançar'),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

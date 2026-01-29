import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/services/audio_service.dart';
import '../../../../core/services/storage_service.dart';
import '../../../../core/providers/cases_provider.dart';
import '../../../../core/config/supabase_config.dart';

class CreateCasePage extends ConsumerStatefulWidget {
  const CreateCasePage({super.key});

  @override
  ConsumerState<CreateCasePage> createState() => _CreateCasePageState();
}

class _CreateCasePageState extends ConsumerState<CreateCasePage> {
  final _textController = TextEditingController();
  bool _isRecording = false;
  bool _hasRecording = false;
  bool _isUploading = false;
  String? _recordingPath;
  Duration _recordingDuration = Duration.zero;

  @override
  void dispose() {
    _textController.dispose();
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

      // Listen to recording progress
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

  Future<void> _submitCase() async {
    if (_textController.text.isEmpty && !_hasRecording) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Digite seu problema ou grave um áudio'),
        ),
      );
      return;
    }

    setState(() => _isUploading = true);

    try {
      String? audioUrl;

      // Upload audio if exists
      if (_hasRecording && _recordingPath != null && SupabaseConfig.useSupabase) {
        final storageService = ref.read(storageServiceProvider);
        final file = File(_recordingPath!);
        audioUrl = await storageService.uploadAudio(file);
      } else if (_hasRecording && !SupabaseConfig.useSupabase) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Upload de áudio desabilitado no modo sem Supabase. O caso será enviado sem áudio.'),
          ),
        );
      }

      // Create case
      await ref.read(casesProvider.notifier).createCase(
            rawText: _textController.text.isNotEmpty ? _textController.text : null,
            audioUrl: audioUrl,
          );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Caso criado com sucesso! A IA está analisando...'),
            backgroundColor: Colors.green,
          ),
        );
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erro ao criar caso: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isUploading = false);
      }
    }
  }

  String _formatDuration(Duration duration) {
    final minutes = duration.inMinutes.remainder(60).toString().padLeft(2, '0');
    final seconds = duration.inSeconds.remainder(60).toString().padLeft(2, '0');
    return '$minutes:$seconds';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Descrever Problema'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Como podemos ajudar?',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              'Descreva seu problema jurídico por texto ou áudio. Nossa IA irá analisar e conectar você com o advogado ideal.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.grey[600],
                  ),
            ),
            const SizedBox(height: 32),

            // Text input
            TextField(
              controller: _textController,
              maxLines: 8,
              decoration: const InputDecoration(
                hintText: 'Descreva seu problema aqui...\n\nExemplo: Fui demitido sem justa causa e não recebi minhas verbas rescisórias...',
                labelText: 'Descrição (opcional se gravar áudio)',
              ),
            ),

            const SizedBox(height: 32),

            const Divider(),

            const SizedBox(height: 16),

            // Audio recording
            Text(
              'Ou grave um áudio',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
              textAlign: TextAlign.center,
            ),

            const SizedBox(height: 24),

            if (_isRecording) ...[
              // Recording indicator
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.red[50],
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.red, width: 2),
                ),
                child: Column(
                  children: [
                    const Icon(Icons.mic, size: 48, color: Colors.red),
                    const SizedBox(height: 16),
                    Text(
                      _formatDuration(_recordingDuration),
                      style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: Colors.red,
                          ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Gravando...',
                      style: TextStyle(color: Colors.red),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _cancelRecording,
                      icon: const Icon(Icons.delete),
                      label: const Text('Cancelar'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.red,
                        side: const BorderSide(color: Colors.red),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: _stopRecording,
                      icon: const Icon(Icons.stop),
                      label: const Text('Parar'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.red,
                      ),
                    ),
                  ),
                ],
              ),
            ] else if (_hasRecording) ...[
              // Recording preview
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.green[50],
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.green, width: 2),
                ),
                child: Column(
                  children: [
                    const Icon(Icons.check_circle, size: 48, color: Colors.green),
                    const SizedBox(height: 16),
                    Text(
                      _formatDuration(_recordingDuration),
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    const SizedBox(height: 8),
                    const Text('Áudio gravado com sucesso!'),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              OutlinedButton.icon(
                onPressed: _cancelRecording,
                icon: const Icon(Icons.refresh),
                label: const Text('Gravar novamente'),
              ),
            ] else ...[
              // Record button
              ElevatedButton.icon(
                onPressed: _startRecording,
                icon: const Icon(Icons.mic, size: 32),
                label: const Padding(
                  padding: EdgeInsets.symmetric(vertical: 16),
                  child: Text(
                    'Pressione para gravar',
                    style: TextStyle(fontSize: 18),
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1E3A8A),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Segure o botão e descreva seu problema',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.grey[600],
                    ),
                textAlign: TextAlign.center,
              ),
            ],

            const SizedBox(height: 32),

            // Submit button
            ElevatedButton(
              onPressed: _isUploading ? null : _submitCase,
              child: _isUploading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : const Text('Enviar caso'),
            ),
          ],
        ),
      ),
    );
  }
}

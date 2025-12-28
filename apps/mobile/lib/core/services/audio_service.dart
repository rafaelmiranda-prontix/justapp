import 'dart:io';
import 'package:flutter_sound/flutter_sound.dart';
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final audioServiceProvider = Provider<AudioService>((ref) {
  return AudioService();
});

class AudioService {
  final FlutterSoundRecorder _recorder = FlutterSoundRecorder();
  bool _isInitialized = false;

  Future<void> initialize() async {
    if (_isInitialized) return;

    await _recorder.openRecorder();
    _isInitialized = true;
  }

  Future<bool> requestPermission() async {
    final status = await Permission.microphone.request();
    return status.isGranted;
  }

  Future<String?> startRecording() async {
    if (!_isInitialized) {
      await initialize();
    }

    final hasPermission = await requestPermission();
    if (!hasPermission) {
      throw Exception('Microphone permission denied');
    }

    final directory = await getTemporaryDirectory();
    final filePath = '${directory.path}/recording_${DateTime.now().millisecondsSinceEpoch}.m4a';

    await _recorder.startRecorder(
      toFile: filePath,
      codec: Codec.aacMP4,
    );

    return filePath;
  }

  Future<void> stopRecording() async {
    if (_recorder.isRecording) {
      await _recorder.stopRecorder();
    }
  }

  Future<void> cancelRecording() async {
    if (_recorder.isRecording) {
      await _recorder.stopRecorder();
    }
  }

  Stream<RecordingDisposition>? getRecordingStream() {
    return _recorder.onProgress;
  }

  Future<void> dispose() async {
    if (_isInitialized) {
      await _recorder.closeRecorder();
      _isInitialized = false;
    }
  }

  bool get isRecording => _recorder.isRecording;

  Future<File?> getCurrentRecording() async {
    if (_recorder.isRecording) {
      final path = await _recorder.stopRecorder();
      if (path != null) {
        return File(path);
      }
    }
    return null;
  }
}

import 'dart:io';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:uuid/uuid.dart';
import '../config/supabase_config.dart';

final storageServiceProvider = Provider<StorageService>((ref) {
  return StorageService();
});

class StorageService {
  final _supabase = Supabase.instance.client;
  final _uuid = const Uuid();

  Future<String> uploadAudio(File audioFile) async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) {
      throw Exception('User not authenticated');
    }

    final fileName = '${_uuid.v4()}.m4a';
    final filePath = '$userId/$fileName';

    await _supabase.storage.from(SupabaseConfig.storageBucket).upload(
          filePath,
          audioFile,
          fileOptions: const FileOptions(
            contentType: 'audio/m4a',
          ),
        );

    final publicUrl = _supabase.storage
        .from(SupabaseConfig.storageBucket)
        .getPublicUrl(filePath);

    return publicUrl;
  }

  Future<void> deleteAudio(String url) async {
    // Extract file path from URL
    final uri = Uri.parse(url);
    final pathSegments = uri.pathSegments;
    final filePath = pathSegments.sublist(pathSegments.indexOf(SupabaseConfig.storageBucket) + 1).join('/');

    await _supabase.storage.from(SupabaseConfig.storageBucket).remove([filePath]);
  }
}

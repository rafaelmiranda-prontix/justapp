import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class StorageService {
  private supabase: SupabaseClient;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    this.supabase = createClient(
      this.configService.get('SUPABASE_URL'),
      this.configService.get('SUPABASE_SERVICE_ROLE_KEY'),
    );
    this.bucketName = this.configService.get('SUPABASE_STORAGE_BUCKET') || 'case-audios';
  }

  async uploadAudio(file: Buffer, fileName: string, userId: string): Promise<string> {
    const filePath = `${userId}/${Date.now()}-${fileName}`;

    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .upload(filePath, file, {
        contentType: 'audio/mpeg',
        upsert: false,
      });

    if (error) {
      throw new Error(`Failed to upload audio: ${error.message}`);
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = this.supabase.storage.from(this.bucketName).getPublicUrl(data.path);

    return publicUrl;
  }

  async deleteAudio(filePath: string): Promise<void> {
    const { error } = await this.supabase.storage.from(this.bucketName).remove([filePath]);

    if (error) {
      throw new Error(`Failed to delete audio: ${error.message}`);
    }
  }

  async getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      throw new Error(`Failed to create signed URL: ${error.message}`);
    }

    return data.signedUrl;
  }
}

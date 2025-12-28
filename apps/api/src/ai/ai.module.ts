import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiService } from './ai.service';
import { StorageService } from './storage.service';

@Module({
  imports: [ConfigModule],
  providers: [AiService, StorageService],
  exports: [AiService, StorageService],
})
export class AiModule {}

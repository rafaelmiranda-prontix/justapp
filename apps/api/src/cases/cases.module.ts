import { Module } from '@nestjs/common';
import { CasesService } from './cases.service';
import { CasesController } from './cases.controller';
import { AiModule } from '../ai/ai.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PublicCasesController } from './public-cases.controller';

@Module({
  imports: [AiModule, PrismaModule],
  controllers: [CasesController, PublicCasesController],
  providers: [CasesService],
  exports: [CasesService],
})
export class CasesModule {}

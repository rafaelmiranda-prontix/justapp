import { Module } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { MatchesController } from './matches.controller';
import { LawyersModule } from '../lawyers/lawyers.module';
import { CasesModule } from '../cases/cases.module';

@Module({
  imports: [LawyersModule, CasesModule],
  controllers: [MatchesController],
  providers: [MatchesService],
})
export class MatchesModule {}

import { Module } from '@nestjs/common';
import { LawyersService } from './lawyers.service';
import { LawyersController } from './lawyers.controller';

@Module({
  controllers: [LawyersController],
  providers: [LawyersService],
  exports: [LawyersService],
})
export class LawyersModule {}

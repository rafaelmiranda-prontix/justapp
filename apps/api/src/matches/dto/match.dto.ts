import { IsString } from 'class-validator';

export class CreateMatchDto {
  @IsString()
  caseId: string;
}

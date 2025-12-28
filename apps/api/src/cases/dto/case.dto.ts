import { IsString, IsOptional, ValidateIf } from 'class-validator';

export class CreateCaseDto {
  @IsOptional()
  @IsString()
  @ValidateIf((o) => !o.audioUrl)
  rawText?: string;

  @IsOptional()
  @IsString()
  @ValidateIf((o) => !o.rawText)
  audioUrl?: string;
}

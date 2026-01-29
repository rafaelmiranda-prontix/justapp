import { IsOptional, IsString, IsBoolean, IsEnum } from 'class-validator';
import { UrgencyLevel } from '@prisma/client';

export class CreateCaseDraftDto {
  @IsOptional()
  @IsString()
  rawText?: string;

  @IsOptional()
  @IsString()
  audioUrl?: string;

  @IsOptional()
  @IsBoolean()
  hasProofs?: boolean;

  @IsOptional()
  @IsString()
  proofTypes?: string;

  @IsOptional()
  @IsBoolean()
  hasContract?: boolean;

  @IsOptional()
  @IsBoolean()
  contactedParty?: boolean;

  @IsOptional()
  @IsString()
  desiredOutcome?: string;

  @IsOptional()
  @IsEnum(UrgencyLevel)
  urgency?: UrgencyLevel;
}

import { IsString, IsArray, IsBoolean, IsOptional } from 'class-validator';

export class CreateLawyerDto {
  @IsString()
  oabNumber: string;

  @IsString()
  oabState: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsArray()
  @IsString({ each: true })
  specialties: string[];
}

export class UpdateLawyerDto {
  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialties?: string[];

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;
}

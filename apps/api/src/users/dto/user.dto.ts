import { IsEmail, IsString, IsEnum, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsString()
  id: string;

  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsEnum(['CLIENT', 'LAWYER', 'ADMIN'])
  role: 'CLIENT' | 'LAWYER' | 'ADMIN';
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}

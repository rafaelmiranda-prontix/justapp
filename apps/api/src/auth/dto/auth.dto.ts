import { IsEmail, IsString, MinLength, IsEnum } from 'class-validator';

export class SignUpDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  name: string;

  @IsEnum(['CLIENT', 'LAWYER'])
  role: 'CLIENT' | 'LAWYER';
}

export class SignInDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

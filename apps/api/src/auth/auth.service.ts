import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  private supabase: SupabaseClient | null = null;
  private useSupabase: boolean;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    const useSupabaseEnv = this.configService.get<string>('USE_SUPABASE');
    this.useSupabase = useSupabaseEnv === undefined ? true : useSupabaseEnv !== 'false';

    if (this.useSupabase) {
      const url = this.configService.get<string>('SUPABASE_URL') || '';
      const anonKey = this.configService.get<string>('SUPABASE_ANON_KEY') || '';

      if (!url || !anonKey) {
        throw new Error('Supabase habilitado, mas SUPABASE_URL/SUPABASE_ANON_KEY não foram definidos.');
      }

      this.supabase = createClient(url, anonKey);
    }
  }

  async signUp(email: string, password: string, name: string, role: 'CLIENT' | 'LAWYER') {
    if (this.useSupabase && this.supabase) {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw new UnauthorizedException(error.message);
      }

      const user = await this.usersService.create({
        id: data.user.id,
        email,
        name,
        role,
      });

      const token = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });

      return {
        user,
        access_token: token,
      };
    }

    // Modo dev sem Supabase: cria usuário localmente e ignora verificação de senha
    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      throw new UnauthorizedException('Email já registrado');
    }

    const user = await this.usersService.create({
      id: randomUUID(),
      email,
      name,
      role,
    });

    const token = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });

    return {
      user,
      access_token: token,
    };
  }

  async signIn(email: string, password: string) {
    if (this.useSupabase && this.supabase) {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const user = await this.usersService.findByEmail(email);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const token = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });

      return {
        user,
        access_token: token,
      };
    }

    // Modo dev sem Supabase: autentica apenas pelo email
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const token = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });

    return {
      user,
      access_token: token,
    };
  }

  async validateUser(userId: string) {
    return this.usersService.findById(userId);
  }
}

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  private supabase: SupabaseClient;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    this.supabase = createClient(
      this.configService.get('SUPABASE_URL'),
      this.configService.get('SUPABASE_ANON_KEY'),
    );
  }

  async signUp(email: string, password: string, name: string, role: 'CLIENT' | 'LAWYER') {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    // Create user in our database
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

  async signIn(email: string, password: string) {
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

  async validateUser(userId: string) {
    return this.usersService.findById(userId);
  }
}

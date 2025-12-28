import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateUserDto) {
    return this.prisma.user.create({
      data,
      include: {
        lawyerProfile: true,
      },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      include: {
        lawyerProfile: true,
      },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        lawyerProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        lawyerProfile: true,
      },
    });
  }

  async update(id: string, data: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data,
      include: {
        lawyerProfile: true,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}

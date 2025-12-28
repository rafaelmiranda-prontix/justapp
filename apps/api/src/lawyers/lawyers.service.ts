import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLawyerDto, UpdateLawyerDto } from './dto/lawyer.dto';

@Injectable()
export class LawyersService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: CreateLawyerDto) {
    // Check if OAB number already exists
    const existingLawyer = await this.prisma.lawyer.findUnique({
      where: { oabNumber: data.oabNumber },
    });

    if (existingLawyer) {
      throw new ConflictException('OAB number already registered');
    }

    return this.prisma.lawyer.create({
      data: {
        userId,
        ...data,
      },
      include: {
        user: true,
      },
    });
  }

  async findAll(specialties?: string[]) {
    const where = specialties?.length
      ? {
          specialties: {
            hasSome: specialties,
          },
        }
      : {};

    return this.prisma.lawyer.findMany({
      where,
      include: {
        user: true,
      },
    });
  }

  async findById(id: string) {
    const lawyer = await this.prisma.lawyer.findUnique({
      where: { id },
      include: {
        user: true,
        matches: {
          include: {
            case: true,
          },
        },
      },
    });

    if (!lawyer) {
      throw new NotFoundException('Lawyer not found');
    }

    return lawyer;
  }

  async findByUserId(userId: string) {
    return this.prisma.lawyer.findUnique({
      where: { userId },
      include: {
        user: true,
      },
    });
  }

  async update(id: string, data: UpdateLawyerDto) {
    return this.prisma.lawyer.update({
      where: { id },
      data,
      include: {
        user: true,
      },
    });
  }

  async addCredits(id: string, amount: number) {
    const lawyer = await this.findById(id);
    return this.prisma.lawyer.update({
      where: { id },
      data: {
        credits: lawyer.credits + amount,
      },
    });
  }

  async deductCredits(id: string, amount: number) {
    const lawyer = await this.findById(id);

    if (lawyer.credits < amount) {
      throw new ConflictException('Insufficient credits');
    }

    return this.prisma.lawyer.update({
      where: { id },
      data: {
        credits: lawyer.credits - amount,
      },
    });
  }
}

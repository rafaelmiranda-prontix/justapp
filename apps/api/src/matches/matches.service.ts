import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LawyersService } from '../lawyers/lawyers.service';
import { CasesService } from '../cases/cases.service';

@Injectable()
export class MatchesService {
  private readonly CREDIT_COST_PER_MATCH = 1;

  constructor(
    private prisma: PrismaService,
    private lawyersService: LawyersService,
    private casesService: CasesService,
  ) {}

  async create(lawyerId: string, caseId: string) {
    // Check if case exists and is open
    const caseData = await this.casesService.findById(caseId);
    if (caseData.status !== 'OPEN') {
      throw new BadRequestException('Case is not available');
    }

    // Check if match already exists
    const existingMatch = await this.prisma.match.findUnique({
      where: {
        caseId_lawyerId: {
          caseId,
          lawyerId,
        },
      },
    });

    if (existingMatch) {
      throw new ConflictException('Match already exists');
    }

    // Deduct credits from lawyer
    await this.lawyersService.deductCredits(lawyerId, this.CREDIT_COST_PER_MATCH);

    // Create match
    const match = await this.prisma.match.create({
      data: {
        caseId,
        lawyerId,
      },
      include: {
        case: {
          include: {
            client: true,
          },
        },
        lawyer: {
          include: {
            user: true,
          },
        },
      },
    });

    // Update case status to MATCHED
    await this.casesService.updateStatus(caseId, 'MATCHED');

    return match;
  }

  async findAll(filters?: { lawyerId?: string; caseId?: string }) {
    const where: any = {};

    if (filters?.lawyerId) where.lawyerId = filters.lawyerId;
    if (filters?.caseId) where.caseId = filters.caseId;

    return this.prisma.match.findMany({
      where,
      include: {
        case: {
          include: {
            client: true,
          },
        },
        lawyer: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        acceptedAt: 'desc',
      },
    });
  }

  async findById(id: string) {
    return this.prisma.match.findUnique({
      where: { id },
      include: {
        case: {
          include: {
            client: true,
          },
        },
        lawyer: {
          include: {
            user: true,
          },
        },
      },
    });
  }
}

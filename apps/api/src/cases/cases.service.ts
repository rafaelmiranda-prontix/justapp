import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { CreateCaseDto } from './dto/case.dto';

@Injectable()
export class CasesService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  async create(clientId: string, data: CreateCaseDto) {
    // Create case with PENDING_ANALYSIS status
    const newCase = await this.prisma.case.create({
      data: {
        clientId,
        rawText: data.rawText,
        audioUrl: data.audioUrl,
        status: 'PENDING_ANALYSIS',
      },
    });

    // Process case with AI asynchronously
    this.processCase(newCase.id).catch((error) => {
      console.error('Error processing case:', error);
    });

    return newCase;
  }

  private async processCase(caseId: string) {
    const caseData = await this.prisma.case.findUnique({
      where: { id: caseId },
    });

    if (!caseData) return;

    let textToAnalyze = caseData.rawText;

    // If audio URL exists, transcribe it first
    if (caseData.audioUrl && !textToAnalyze) {
      textToAnalyze = await this.aiService.transcribeAudio(caseData.audioUrl);
      await this.prisma.case.update({
        where: { id: caseId },
        data: { rawText: textToAnalyze },
      });
    }

    if (!textToAnalyze) {
      throw new Error('No text to analyze');
    }

    // Analyze case with AI
    const analysis = await this.aiService.analyzeCase(textToAnalyze);

    // Update case with analysis results
    await this.prisma.case.update({
      where: { id: caseId },
      data: {
        category: analysis.category,
        subCategory: analysis.subCategory,
        technicalSummary: analysis.technicalSummary,
        urgency: analysis.urgency,
        aiConfidence: analysis.confidence,
        status: 'OPEN',
      },
    });
  }

  async findAll(filters?: { status?: string; category?: string; clientId?: string }) {
    const where: any = {};

    if (filters?.status) where.status = filters.status;
    if (filters?.category) where.category = filters.category;
    if (filters?.clientId) where.clientId = filters.clientId;

    return this.prisma.case.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        matches: {
          include: {
            lawyer: {
              include: {
                user: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findById(id: string) {
    const caseData = await this.prisma.case.findUnique({
      where: { id },
      include: {
        client: true,
        matches: {
          include: {
            lawyer: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!caseData) {
      throw new NotFoundException('Case not found');
    }

    return caseData;
  }

  async findOpenCases(specialties?: string[]) {
    const where: any = {
      status: 'OPEN',
    };

    if (specialties?.length) {
      where.category = {
        in: specialties,
      };
    }

    return this.prisma.case.findMany({
      where,
      select: {
        id: true,
        category: true,
        subCategory: true,
        technicalSummary: true, // Anonimizado
        urgency: true,
        aiConfidence: true,
        createdAt: true,
        // NÃO incluir rawText, audioUrl ou client
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.case.update({
      where: { id },
      data: { status: status as any },
    });
  }
}

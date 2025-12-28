import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { CreateMatchDto } from './dto/match.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('matches')
@UseGuards(JwtAuthGuard)
export class MatchesController {
  constructor(private matchesService: MatchesService) {}

  @Post()
  @Roles('LAWYER')
  @UseGuards(RolesGuard)
  async create(@Request() req, @Body() createMatchDto: CreateMatchDto) {
    // Get lawyer profile from user
    const lawyerProfile = req.user.lawyerProfile;
    if (!lawyerProfile) {
      throw new Error('Lawyer profile not found');
    }

    return this.matchesService.create(lawyerProfile.id, createMatchDto.caseId);
  }

  @Get()
  findAll(@Query('lawyerId') lawyerId?: string, @Query('caseId') caseId?: string) {
    return this.matchesService.findAll({ lawyerId, caseId });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.matchesService.findById(id);
  }
}

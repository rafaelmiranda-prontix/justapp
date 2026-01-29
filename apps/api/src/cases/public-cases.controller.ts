import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { CasesService } from './cases.service';
import { CreateCaseDraftDto } from './dto/case-draft.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('public/cases')
export class PublicCasesController {
  constructor(private casesService: CasesService) {}

  // Rota pública para criar rascunho sem login
  @Post('draft')
  async createDraft(@Body() dto: CreateCaseDraftDto) {
    return this.casesService.createDraft(dto);
  }

  // Rota autenticada para promover o rascunho a caso real
  @Post('draft/:id/confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CLIENT')
  async confirmDraft(@Request() req) {
    const draftId = req.params.id;
    return this.casesService.promoteDraft(draftId, req.user.id);
  }
}

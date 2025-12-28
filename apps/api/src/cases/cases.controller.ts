import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CasesService } from './cases.service';
import { CreateCaseDto } from './dto/case.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('cases')
@UseGuards(JwtAuthGuard)
export class CasesController {
  constructor(private casesService: CasesService) {}

  @Post()
  @Roles('CLIENT')
  @UseGuards(RolesGuard)
  create(@Request() req, @Body() createCaseDto: CreateCaseDto) {
    return this.casesService.create(req.user.id, createCaseDto);
  }

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.casesService.findAll({ status, category, clientId });
  }

  @Get('open')
  @Roles('LAWYER')
  @UseGuards(RolesGuard)
  findOpenCases(@Query('specialties') specialties?: string) {
    const specialtiesArray = specialties ? specialties.split(',') : undefined;
    return this.casesService.findOpenCases(specialtiesArray);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.casesService.findById(id);
  }
}

import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { LawyersService } from './lawyers.service';
import { CreateLawyerDto, UpdateLawyerDto } from './dto/lawyer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('lawyers')
@UseGuards(JwtAuthGuard)
export class LawyersController {
  constructor(private lawyersService: LawyersService) {}

  @Post()
  @Roles('LAWYER')
  @UseGuards(RolesGuard)
  create(@Request() req, @Body() createLawyerDto: CreateLawyerDto) {
    return this.lawyersService.create(req.user.id, createLawyerDto);
  }

  @Get()
  findAll(@Query('specialties') specialties?: string) {
    const specialtiesArray = specialties ? specialties.split(',') : undefined;
    return this.lawyersService.findAll(specialtiesArray);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.lawyersService.findById(id);
  }

  @Put(':id')
  @Roles('LAWYER')
  @UseGuards(RolesGuard)
  update(@Param('id') id: string, @Body() updateLawyerDto: UpdateLawyerDto) {
    return this.lawyersService.update(id, updateLawyerDto);
  }

  @Post(':id/credits/add')
  @Roles('LAWYER', 'ADMIN')
  @UseGuards(RolesGuard)
  addCredits(@Param('id') id: string, @Body('amount') amount: number) {
    return this.lawyersService.addCredits(id, amount);
  }
}

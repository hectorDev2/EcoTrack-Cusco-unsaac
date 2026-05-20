import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('incidents')
export class IncidentsController {
  constructor(private incidentsService: IncidentsService) {}

  @Get('my')
  @UseGuards(JwtAuthGuard)
  findMy(@CurrentUser('id') userId: string) {
    return this.incidentsService.findByUser(userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateIncidentDto, @CurrentUser('id') userId: string) {
    return this.incidentsService.create(dto, userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  findAll(@Query('status') status?: string) {
    return this.incidentsService.findAll(status);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.incidentsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateIncidentDto) {
    return this.incidentsService.update(id, dto);
  }
}

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IncidentsService } from './incidents.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Incidents')
@Controller('incidents')
export class IncidentsController {
  constructor(private incidentsService: IncidentsService) {}

  @ApiOperation({ summary: 'Get my incidents' })
  @ApiBearerAuth()
  @Get('my')
  @UseGuards(JwtAuthGuard)
  findMy(@CurrentUser('id') userId: string) {
    return this.incidentsService.findByUser(userId);
  }

  @ApiOperation({ summary: 'Create a new incident' })
  @ApiBearerAuth()
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateIncidentDto, @CurrentUser('id') userId: string) {
    return this.incidentsService.create(dto, userId);
  }

  @ApiOperation({ summary: 'Get all incidents (admin)' })
  @ApiBearerAuth()
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  findAll(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.incidentsService.findAll(status, page ? Number(page) : 1, limit ? Number(limit) : 10);
  }

  @ApiOperation({ summary: 'Get incident by ID' })
  @ApiBearerAuth()
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.incidentsService.findOne(id);
  }

  @ApiOperation({ summary: 'Update incident (admin)' })
  @ApiBearerAuth()
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateIncidentDto) {
    return this.incidentsService.update(id, dto);
  }

  @ApiOperation({ summary: 'Delete incident (admin)' })
  @ApiBearerAuth()
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.incidentsService.remove(id);
  }
}

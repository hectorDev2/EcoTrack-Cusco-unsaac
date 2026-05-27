import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CollectionSchedulesService } from './collection-schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Collection Schedules')
@Controller('schedules')
export class CollectionSchedulesController {
  constructor(private schedulesService: CollectionSchedulesService) {}

  @ApiOperation({ summary: 'Get all schedules' })
  @Public()
  @Get()
  findAll(
    @Query('zoneId') zoneId?: string,
    @Query('wasteTypeId') wasteTypeId?: string,
  ) {
    return this.schedulesService.findAll(zoneId, wasteTypeId);
  }

  @ApiOperation({ summary: 'Get schedule by ID' })
  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.schedulesService.findOne(id);
  }

  @ApiOperation({ summary: 'Create a new schedule (admin)' })
  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  create(@Body() dto: CreateScheduleDto) {
    return this.schedulesService.create(dto);
  }

  @ApiOperation({ summary: 'Update schedule (admin)' })
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateScheduleDto) {
    return this.schedulesService.update(id, dto);
  }

  @ApiOperation({ summary: 'Delete schedule (admin)' })
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.schedulesService.remove(id);
  }
}

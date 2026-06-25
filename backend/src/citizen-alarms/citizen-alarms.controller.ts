import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CitizenAlarmsService } from './citizen-alarms.service';
import { CreateCitizenAlarmDto } from './dto/create-citizen-alarm.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Citizen Alarms')
@Controller('citizen-alarms')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('CITIZEN')
export class CitizenAlarmsController {
  constructor(private readonly alarmsService: CitizenAlarmsService) {}

  @ApiOperation({ summary: 'Create alarm (citizen)' })
  @ApiBearerAuth()
  @Post()
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCitizenAlarmDto,
  ) {
    return this.alarmsService.create(userId, dto);
  }

  @ApiOperation({ summary: 'Get my alarms (citizen)' })
  @ApiBearerAuth()
  @Get()
  findMine(@CurrentUser('id') userId: string) {
    return this.alarmsService.findByUser(userId);
  }

  @ApiOperation({ summary: 'Delete alarm (citizen)' })
  @ApiBearerAuth()
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.alarmsService.remove(id, userId);
  }
}

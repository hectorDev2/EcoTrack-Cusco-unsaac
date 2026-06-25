import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserAlarmsService } from './user-alarms.service';
import { CreateUserAlarmDto } from './dto/create-user-alarm.dto';
import { UpdateUserAlarmDto } from './dto/update-user-alarm.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('User Alarms')
@Controller('user-alarms')
@UseGuards(JwtAuthGuard)
export class UserAlarmsController {
  constructor(private userAlarmsService: UserAlarmsService) {}

  @ApiOperation({ summary: 'Get my alarms' })
  @ApiBearerAuth()
  @Get('my')
  findMy(@CurrentUser('id') userId: string) {
    return this.userAlarmsService.findByUser(userId);
  }

  @ApiOperation({ summary: 'Create a new alarm' })
  @ApiBearerAuth()
  @Post()
  create(@Body() dto: CreateUserAlarmDto, @CurrentUser('id') userId: string) {
    return this.userAlarmsService.create(dto, userId);
  }

  @ApiOperation({ summary: 'Get alarm by ID' })
  @ApiBearerAuth()
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.userAlarmsService.findOne(id, userId);
  }

  @ApiOperation({ summary: 'Update alarm' })
  @ApiBearerAuth()
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserAlarmDto, @CurrentUser('id') userId: string) {
    return this.userAlarmsService.update(id, dto, userId);
  }

  @ApiOperation({ summary: 'Delete alarm' })
  @ApiBearerAuth()
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.userAlarmsService.remove(id, userId);
  }
}

import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { PickupPointsService } from './pickup-points.service';
import { CreatePickupPointDto } from './dto/create-pickup-point.dto';
import { UpdatePickupPointDto } from './dto/update-pickup-point.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller('pickup-points')
export class PickupPointsController {
  constructor(private pickupPointsService: PickupPointsService) {}

  @Public()
  @Get()
  findAll(@Query('zoneId') zoneId?: string) {
    return this.pickupPointsService.findAll(zoneId);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pickupPointsService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  create(@Body() dto: CreatePickupPointDto) {
    return this.pickupPointsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdatePickupPointDto) {
    return this.pickupPointsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  deactivate(@Param('id') id: string) {
    return this.pickupPointsService.deactivate(id);
  }
}

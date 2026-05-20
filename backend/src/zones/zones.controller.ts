import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ZonesService } from './zones.service';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller('zones')
export class ZonesController {
  constructor(private zonesService: ZonesService) {}

  @Public()
  @Get()
  findAll() {
    return this.zonesService.findActive();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.zonesService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  create(@Body() dto: CreateZoneDto) {
    return this.zonesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateZoneDto) {
    return this.zonesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  deactivate(@Param('id') id: string) {
    return this.zonesService.deactivate(id);
  }
}

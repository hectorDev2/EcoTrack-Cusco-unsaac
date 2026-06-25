import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ZonesService } from './zones.service';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Zones')
@Controller('zones')
export class ZonesController {
  constructor(private zonesService: ZonesService) {}

  @ApiOperation({ summary: 'Get all active zones' })
  @Public()
  @Get()
  findAll() {
    return this.zonesService.findActive();
  }

  @ApiOperation({ summary: 'Get zone by ID' })
  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.zonesService.findOne(id);
  }

  @ApiOperation({ summary: 'Create a new zone (admin)' })
  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  create(@Body() dto: CreateZoneDto) {
    return this.zonesService.create(dto);
  }

  @ApiOperation({ summary: 'Update zone (admin)' })
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateZoneDto) {
    return this.zonesService.update(id, dto);
  }

  @ApiOperation({ summary: 'Deactivate zone (admin)' })
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  deactivate(@Param('id') id: string) {
    return this.zonesService.deactivate(id);
  }
}

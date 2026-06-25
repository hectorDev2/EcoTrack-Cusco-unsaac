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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Vehicles')
@Controller('vehicles')
@UseGuards(RolesGuard)
@Roles('ADMIN')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @ApiOperation({ summary: 'Create a new vehicle (admin)' })
  @ApiBearerAuth()
  @Post()
  create(@Body() dto: CreateVehicleDto) {
    return this.vehiclesService.create(dto);
  }

  @ApiOperation({ summary: 'Get all vehicles (admin)' })
  @ApiBearerAuth()
  @Get()
  findAll() {
    return this.vehiclesService.findAll();
  }

  @ApiOperation({ summary: 'Get vehicle by ID (admin)' })
  @ApiBearerAuth()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vehiclesService.findOne(id);
  }

  @ApiOperation({ summary: 'Update vehicle (admin)' })
  @ApiBearerAuth()
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateVehicleDto) {
    return this.vehiclesService.update(id, dto);
  }

  @ApiOperation({ summary: 'Deactivate vehicle (admin)' })
  @ApiBearerAuth()
  @Delete(':id')
  deactivate(@Param('id') id: string) {
    return this.vehiclesService.deactivate(id);
  }
}

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
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PickupPointsService } from './pickup-points.service';
import { CreatePickupPointDto } from './dto/create-pickup-point.dto';
import { UpdatePickupPointDto } from './dto/update-pickup-point.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Pickup Points')
@Controller('pickup-points')
export class PickupPointsController {
  constructor(private pickupPointsService: PickupPointsService) {}

  @ApiOperation({ summary: 'Get all pickup points' })
  @Public()
  @Get()
  findAll(@Query('zoneId') zoneId?: string) {
    return this.pickupPointsService.findAll(zoneId);
  }

  @ApiOperation({ summary: 'Get pickup point by ID' })
  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pickupPointsService.findOne(id);
  }

  @ApiOperation({ summary: 'Create a new pickup point (admin)' })
  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  create(@Body() dto: CreatePickupPointDto) {
    return this.pickupPointsService.create(dto);
  }

  @ApiOperation({ summary: 'Update pickup point (admin)' })
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdatePickupPointDto) {
    return this.pickupPointsService.update(id, dto);
  }

  @ApiOperation({ summary: 'Deactivate pickup point (admin)' })
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  deactivate(@Param('id') id: string) {
    return this.pickupPointsService.deactivate(id);
  }
}

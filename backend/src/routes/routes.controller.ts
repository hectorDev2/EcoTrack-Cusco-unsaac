import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { RoutesService } from './routes.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('routes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Get('fleet')
  @Roles('ADMIN')
  getFleet() {
    return this.routesService.getFleetOverview();
  }

  @Get('my')
  @Roles('DRIVER')
  findMy(@CurrentUser('id') userId: string) {
    return this.routesService.findByDriver(userId);
  }

  @Get()
  @Roles('ADMIN')
  findAll() {
    return this.routesService.findAll();
  }

  @Get(':id')
  @Roles('ADMIN')
  findOne(@Param('id') id: string) {
    return this.routesService.findOne(id);
  }

  @Post()
  @Roles('ADMIN')
  create(@Body() dto: CreateRouteDto) {
    return this.routesService.create(dto);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateRouteDto) {
    return this.routesService.update(id, dto);
  }

  @Patch(':id/start')
  @Roles('DRIVER')
  startRoute(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.routesService.startRoute(id, userId);
  }

  @Patch(':id/complete')
  @Roles('DRIVER')
  completeRoute(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.routesService.completeRoute(id, userId);
  }
}

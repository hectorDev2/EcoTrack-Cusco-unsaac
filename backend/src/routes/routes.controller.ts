import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RoutesService } from './routes.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Routes')
@Controller('routes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @ApiOperation({ summary: 'Get simplified list of routes for citizen' })
  @Public()
  @Get('public')
  findPublic() {
    return this.routesService.findPublic();
  }

  @ApiOperation({ summary: 'Get fleet overview (admin)' })
  @ApiBearerAuth()
  @Get('fleet')
  @Roles('ADMIN')
  getFleet() {
    return this.routesService.getFleetOverview();
  }

  @ApiOperation({ summary: 'Get my routes (driver)' })
  @ApiBearerAuth()
  @Get('my')
  @Roles('DRIVER')
  findMy(@CurrentUser('id') userId: string) {
    return this.routesService.findByDriver(userId);
  }

  @ApiOperation({ summary: 'Get active routes (citizen)' })
  @ApiBearerAuth()
  @Get('active')
  @Roles('CITIZEN')
  findActive() {
    return this.routesService.findActive();
  }

  @ApiOperation({ summary: 'Get routes by zone' })
  @ApiBearerAuth()
  @Get('zone/:zoneId')
  findByZone(@Param('zoneId') zoneId: string) {
    return this.routesService.findByZone(zoneId);
  }

  @ApiOperation({ summary: 'Get all routes (admin)' })
  @ApiBearerAuth()
  @Get()
  @Roles('ADMIN')
  findAll() {
    return this.routesService.findAll();
  }

  @ApiOperation({ summary: 'Get route by ID (admin)' })
  @ApiBearerAuth()
  @Get(':id')
  @Roles('ADMIN')
  findOne(@Param('id') id: string) {
    return this.routesService.findOne(id);
  }

  @ApiOperation({ summary: 'Create a new route (admin)' })
  @ApiBearerAuth()
  @Post()
  @Roles('ADMIN')
  create(@Body() dto: CreateRouteDto) {
    return this.routesService.create(dto);
  }

  @ApiOperation({ summary: 'Update route (admin)' })
  @ApiBearerAuth()
  @Patch(':id')
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateRouteDto) {
    return this.routesService.update(id, dto);
  }

  @ApiOperation({ summary: 'Start route (driver)' })
  @ApiBearerAuth()
  @Patch(':id/start')
  @Roles('DRIVER')
  startRoute(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.routesService.startRoute(id, userId);
  }

  @ApiOperation({ summary: 'Send live GPS location (driver)' })
  @ApiBearerAuth()
  @Post(':id/location')
  @Roles('DRIVER')
  sendLocation(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() body: { latitude: number; longitude: number },
  ) {
    return this.routesService.sendLocation(
      id,
      userId,
      body.latitude,
      body.longitude,
    );
  }

  @ApiOperation({ summary: 'Get route locations (admin)' })
  @ApiBearerAuth()
  @Get(':id/locations')
  @Roles('ADMIN')
  getLocations(@Param('id') id: string) {
    return this.routesService.getLocations(id);
  }

  @ApiOperation({ summary: 'Complete route (driver)' })
  @ApiBearerAuth()
  @Patch(':id/complete')
  @Roles('DRIVER')
  completeRoute(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.routesService.completeRoute(id, userId);
  }
}

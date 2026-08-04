import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DemoSimulationService } from './demo-simulation.service';
import { DemoModeGuard } from './demo-mode.guard';
import { StartDemoDto } from './dto/start-demo.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Demo')
@Controller('demo')
export class DemoController {
  constructor(private readonly demoService: DemoSimulationService) {}

  @ApiOperation({ summary: 'Saber si el modo demo está habilitado en este entorno' })
  @Public()
  @Get('enabled')
  enabled() {
    // Activado por defecto — se desactiva explícitamente con "false" en .env
    return { enabled: process.env.DEMO_MODE_ENABLED !== 'false' };
  }

  @ApiOperation({ summary: 'Iniciar simulación de movimiento de una ruta (conductor)' })
  @ApiBearerAuth()
  @UseGuards(RolesGuard, DemoModeGuard)
  @Roles('DRIVER')
  @Post('routes/:id/start')
  start(
    @Param('id') id: string,
    @CurrentUser('id') driverId: string,
    @Body() dto: StartDemoDto,
  ) {
    return this.demoService.startDemo(id, driverId, dto);
  }

  @ApiOperation({ summary: 'Detener simulación de una ruta (conductor)' })
  @ApiBearerAuth()
  @UseGuards(RolesGuard, DemoModeGuard)
  @Roles('DRIVER')
  @Post('routes/:id/stop')
  stop(@Param('id') id: string, @CurrentUser('id') driverId: string) {
    return this.demoService.stopDemo(id, driverId);
  }

  @ApiOperation({ summary: 'Estado de la simulación de una ruta (conductor o admin viendo la flota)' })
  @ApiBearerAuth()
  @UseGuards(RolesGuard, DemoModeGuard)
  @Roles('DRIVER', 'ADMIN')
  @Get('routes/:id/status')
  status(@Param('id') id: string) {
    return this.demoService.getStatus(id);
  }
}

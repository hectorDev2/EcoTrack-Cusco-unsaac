import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @ApiOperation({ summary: 'Get dashboard data (admin)' })
  @ApiBearerAuth()
  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @ApiOperation({ summary: 'Get analytics data (admin)' })
  @ApiBearerAuth()
  @Get('analytics')
  getAnalytics() {
    return this.adminService.getAnalytics();
  }
}

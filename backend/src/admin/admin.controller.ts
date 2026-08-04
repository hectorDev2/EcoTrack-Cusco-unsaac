import { Controller, Get, Query, UseGuards } from '@nestjs/common';
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

  @ApiOperation({ summary: 'Get notification history (admin)' })
  @ApiBearerAuth()
  @Get('notifications')
  getNotifications(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
  ) {
    return this.adminService.getNotifications(
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
      type,
    );
  }
}

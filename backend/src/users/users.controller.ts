import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { AssignZonesDto } from './dto/assign-zones.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @ApiOperation({ summary: 'Get my profile' })
  @ApiBearerAuth()
  @Get('me')
  getMyProfile(@CurrentUser('id') userId: string) {
    return this.usersService.getMyProfile(userId);
  }

  @ApiOperation({ summary: 'Get user stats (admin)' })
  @ApiBearerAuth()
  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  getStats() {
    return this.usersService.getStats();
  }

  @ApiOperation({ summary: 'Get all users (admin)' })
  @ApiBearerAuth()
  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  findAll(@Query() query: QueryUserDto) {
    return this.usersService.findAll(query);
  }

  @ApiOperation({ summary: 'Get user by ID (admin)' })
  @ApiBearerAuth()
  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @ApiOperation({ summary: 'Create a new user (admin)' })
  @ApiBearerAuth()
  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @ApiOperation({ summary: 'Update user (admin)' })
  @ApiBearerAuth()
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @ApiOperation({ summary: 'Assign zones to user (admin)' })
  @ApiBearerAuth()
  @Patch(':id/zones')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  assignZones(@Param('id') id: string, @Body() dto: AssignZonesDto) {
    return this.usersService.assignZones(id, dto);
  }

  @ApiOperation({ summary: 'Deactivate user (admin)' })
  @ApiBearerAuth()
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  deactivate(@Param('id') id: string) {
    return this.usersService.deactivate(id);
  }
}

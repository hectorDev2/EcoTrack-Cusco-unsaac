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
import { WasteTypesService } from './waste-types.service';
import { CreateWasteTypeDto } from './dto/create-waste-type.dto';
import { UpdateWasteTypeDto } from './dto/update-waste-type.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Waste Types')
@Controller('waste-types')
export class WasteTypesController {
  constructor(private readonly wasteTypesService: WasteTypesService) {}

  @ApiOperation({ summary: 'Get all waste types' })
  @Public()
  @Get()
  findAll() {
    return this.wasteTypesService.findAll();
  }

  @ApiOperation({ summary: 'Get waste type by ID' })
  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.wasteTypesService.findOne(id);
  }

  @ApiOperation({ summary: 'Create a new waste type (admin)' })
  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  create(@Body() dto: CreateWasteTypeDto) {
    return this.wasteTypesService.create(dto);
  }

  @ApiOperation({ summary: 'Update waste type (admin)' })
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateWasteTypeDto) {
    return this.wasteTypesService.update(id, dto);
  }

  @ApiOperation({ summary: 'Delete waste type (admin)' })
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.wasteTypesService.remove(id);
  }
}

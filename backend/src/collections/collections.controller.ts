import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CollectionsService } from './collections.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Collections')
@Controller('collections')
@UseGuards(RolesGuard)
@Roles('DRIVER')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @ApiOperation({ summary: 'Create a new collection record (driver)' })
  @ApiBearerAuth()
  @Post()
  create(@Body() dto: CreateCollectionDto, @CurrentUser('id') userId: string) {
    return this.collectionsService.create(dto, userId);
  }
}

import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { FrequenciesService } from './frequencies.service';

@ApiTags('Frequencies')
@Controller('frequencies')
export class FrequenciesController {
  constructor(private service: FrequenciesService) {}

  @Public()
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Public()
  @Get(':code')
  findOne(@Param('code') code: string) {
    return this.service.findOne(code);
  }
}

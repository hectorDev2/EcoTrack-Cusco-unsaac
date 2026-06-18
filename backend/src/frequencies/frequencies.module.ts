import { Module } from '@nestjs/common';
import { FrequenciesController } from './frequencies.controller';
import { FrequenciesService } from './frequencies.service';

@Module({
  controllers: [FrequenciesController],
  providers: [FrequenciesService],
})
export class FrequenciesModule {}

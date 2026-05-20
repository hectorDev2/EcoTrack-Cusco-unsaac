import { Module } from '@nestjs/common';
import { CollectionSchedulesController } from './collection-schedules.controller';
import { CollectionSchedulesService } from './collection-schedules.service';

@Module({
  controllers: [CollectionSchedulesController],
  providers: [CollectionSchedulesService],
})
export class CollectionSchedulesModule {}

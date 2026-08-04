import { Module } from '@nestjs/common';
import { DemoStateService } from './demo-state.service';

@Module({
  providers: [DemoStateService],
  exports: [DemoStateService],
})
export class DemoStateModule {}

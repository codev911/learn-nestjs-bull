import { Module } from '@nestjs/common';
import { BullController } from './bull.controller';
import { BullProcessor } from './bull.processor';

@Module({
  controllers: [BullController],
  providers: [BullProcessor],
})
export class BullModule {}

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { BullController } from './bull.controller';
import { BullProcessor } from './bull.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'blockchain',
    }),
  ],
  controllers: [BullController],
  providers: [BullProcessor],
})
export class BullsModule {}

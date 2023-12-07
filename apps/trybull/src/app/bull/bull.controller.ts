import { InjectQueue } from '@nestjs/bull';
import { Controller, Post } from '@nestjs/common';
import { Queue } from 'bull';

@Controller('bull')
export class BullController {
  constructor(@InjectQueue('blockchain') private readonly blockchainQueue: Queue) {}

  @Post('multicall')
  async transcode() {
    const queue = [];

    for (let index = 0; index < 5; index++) {
      queue.push(
        this.blockchainQueue.add(
          'forwardTransaction',
          {
            type: 'faucet',
            data: {
              wallets: [
                '0xE018554a4FdC054e3f57d90e2d764a86A4486B79',
                '0xE018554a4FdC054e3f57d90e2d764a86A4486B79'
              ],
              amount: 0.01
            }
          },
          {
            delay: 2000
          }
        )
      );

      queue.push(
        this.blockchainQueue.add(
          'forwardTransaction',
          {
            type: 'multicall',
            data: [
              {
                from: '0xE018554a4FdC054e3f57d90e2d764a86A4486B79',
                to: '0xE018554a4FdC054e3f57d90e2d764a86A4486B79',
                id: 0,
                amount: 1
              },
              {
                from: '0xE018554a4FdC054e3f57d90e2d764a86A4486B79',
                to: '0xE018554a4FdC054e3f57d90e2d764a86A4486B79',
                id: 0,
                amount: 1
              },
              {
                from: '0xE018554a4FdC054e3f57d90e2d764a86A4486B79',
                to: '0xE018554a4FdC054e3f57d90e2d764a86A4486B79',
                id: 0,
                amount: 1
              },
            ]
          },
          {
            delay: 2000
          }
        )
      )
    }

    await Promise.all(queue);

    return {
      process: true
    }
  }
}

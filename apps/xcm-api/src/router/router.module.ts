import { Module } from '@nestjs/common';
import { RouterService } from './router.service.js';
import { RouterController } from './router.controller.js';

@Module({
  controllers: [RouterController],
  providers: [RouterService],
})
export class RouterModule {}

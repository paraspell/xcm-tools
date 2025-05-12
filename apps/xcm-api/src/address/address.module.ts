import { Module } from '@nestjs/common';

import { AddressController } from './address.controller.js';
import { AddressService } from './address.service.js';

@Module({
  controllers: [AddressController],
  providers: [AddressService],
})
export class AddressModule {}

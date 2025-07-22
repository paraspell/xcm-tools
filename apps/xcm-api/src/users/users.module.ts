import { Global, Module } from '@nestjs/common';

import { UsersService } from './users.service.js';

@Global()
@Module({
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

import type { INestApplication } from '@nestjs/common';
import type { ExpressAdapter } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { replaceBigInt } from '@paraspell/sdk';

import { AppModule } from '../../src/app.module';

export const createTestApp = async (): Promise<INestApplication> => {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  (app.getHttpAdapter().getInstance() as ExpressAdapter).set(
    'json replacer',
    replaceBigInt,
  );
  await app.init();
  return app;
};

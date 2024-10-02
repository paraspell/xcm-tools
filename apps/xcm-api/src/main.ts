import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { replaceBigInt } from './utils/replaceBigInt.js';

export const bootstrap = async () => {
  const app = await NestFactory.create(AppModule);
  (app.getHttpAdapter().getInstance() as ExpressAdapter).set(
    'json replacer',
    replaceBigInt,
  );
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe());
  const DEFAULT_PORT = 3001;
  await app.listen(process.env.PORT || DEFAULT_PORT);
};

void bootstrap();

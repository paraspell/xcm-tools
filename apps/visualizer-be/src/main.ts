import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';

import { AppModule } from './app/app.module.js';

export const bootstrap = async () => {
  const options = { cors: true };
  const app = await NestFactory.create(AppModule, options);

  app.useWebSocketAdapter(new IoAdapter(app));

  await app.listen(4201);
};

void bootstrap();

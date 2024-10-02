import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

export const bootstrap = async () => {
  const options = { cors: true };
  const app = await NestFactory.create(AppModule, options);
  await app.listen(4201);
};

void bootstrap();

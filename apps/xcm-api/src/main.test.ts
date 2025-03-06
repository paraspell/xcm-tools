import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { Mock } from 'vitest';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { AppModule } from './app.module.js';

vi.mock('@nestjs/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nestjs/core')>();
  return {
    ...actual,
    NestFactory: {
      create: vi.fn(),
    },
  };
});

describe('Application Bootstrap', () => {
  let mockApp: {
    enableCors: Mock;
    useGlobalPipes: Mock;
    listen: Mock;
    getHttpAdapter: () => { getInstance: () => { set: Mock } };
  };

  beforeAll(() => {
    mockApp = {
      enableCors: vi.fn(),
      useGlobalPipes: vi.fn(),
      listen: vi.fn(),
      getHttpAdapter: () => ({ getInstance: () => ({ set: vi.fn() }) }),
    };

    (NestFactory.create as Mock).mockResolvedValue(mockApp);
  });

  it('should bootstrap the application and listen on the correct port', async () => {
    const { bootstrap } = await import('./main.js');

    await bootstrap();

    expect(() => NestFactory.create(AppModule, { cors: true })).not.toThrow();

    expect(mockApp.enableCors).toHaveBeenCalled();
    expect(mockApp.useGlobalPipes).toHaveBeenCalledWith(
      expect.any(ValidationPipe),
    );

    expect(mockApp.listen).toHaveBeenCalledWith(process.env.PORT || 3001);
  });
});

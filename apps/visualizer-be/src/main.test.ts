import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';

import { AppModule } from './app/app.module';

jest.mock('@nestjs/core', () => {
  const actual =
    jest.requireActual<typeof import('@nestjs/core')>('@nestjs/core');

  return {
    ...actual,
    NestFactory: {
      create: jest.fn(),
    },
  };
});

describe('Application Bootstrap', () => {
  let mockApp: { listen: jest.Mock; useWebSocketAdapter: jest.Mock };

  beforeAll(() => {
    mockApp = {
      listen: jest.fn(),
      useWebSocketAdapter: jest.fn(),
    };

    (NestFactory.create as jest.Mock).mockResolvedValue(mockApp);
  });

  it('should bootstrap the application and listen on the correct port', async () => {
    const { bootstrap } = await import('./main');

    const spy = jest.spyOn(NestFactory, 'create');

    await bootstrap();

    expect(spy).toHaveBeenCalledWith(AppModule, { cors: true });

    expect(mockApp.listen).toHaveBeenCalledWith(4201);
    expect(mockApp.useWebSocketAdapter).toHaveBeenCalled();
    const adapterCalls = mockApp.useWebSocketAdapter.mock.calls;
    const [adapter] = adapterCalls[adapterCalls.length - 1];
    expect(adapter).toBeInstanceOf(IoAdapter);
  });
});

import { NestFactory } from '@nestjs/core';

import { AppModule } from './app/app.module';

jest.mock('@nestjs/core', () => ({
  NestFactory: {
    create: jest.fn(),
  },
}));

describe('Application Bootstrap', () => {
  let mockApp: { listen: jest.Mock };

  beforeAll(() => {
    mockApp = {
      listen: jest.fn(),
    };

    (NestFactory.create as jest.Mock).mockResolvedValue(mockApp);
  });

  it('should bootstrap the application and listen on the correct port', async () => {
    const { bootstrap } = await import('./main');

    await bootstrap();

    expect(() => NestFactory.create(AppModule, { cors: true })).not.toThrow();

    expect(mockApp.listen).toHaveBeenCalledWith(4201);
  });
});

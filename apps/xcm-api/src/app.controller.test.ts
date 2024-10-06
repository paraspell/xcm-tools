import { describe, beforeEach, it, expect } from 'vitest';
import { Test, type TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return undefined because it redirects to LightSpell homepage', () => {
      expect(appController.root()).toBeUndefined();
    });
  });

  describe('sentryTest', () => {
    it('should return a message when NODE_ENV is production', () => {
      process.env.NODE_ENV = 'production';

      const result = appController.sentryTest();
      expect(result).toBe('Sentry test is only available in development mode.');
    });

    it('should throw an error when NODE_ENV is not production', () => {
      process.env.NODE_ENV = 'development';

      expect(() => appController.sentryTest()).toThrowError('Sentry test');
    });
  });
});

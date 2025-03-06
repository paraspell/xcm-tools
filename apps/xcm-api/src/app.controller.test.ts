import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it } from 'vitest';

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

import type { Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AnalyticsService } from '../analytics/analytics.service.js';
import { EventName } from '../analytics/EventName.js';
import { AuthController } from './auth.controller.js';
import type { AuthService } from './auth.service.js';
import { HigherRequestLimitDto } from './dto/HigherRequestLimitDto.js';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;
  let analyticsService: AnalyticsService;

  beforeEach(() => {
    authService = {
      generateApiKey: vi.fn(),
      submitHigherRequestLimitForm: vi.fn(),
    } as unknown as AuthService;

    analyticsService = {
      track: vi.fn(),
    } as unknown as AnalyticsService;

    authController = new AuthController(authService, analyticsService);
  });

  describe('generateApiKey', () => {
    it('should call analyticsService.track and authService.generateApiKey with correct parameters', async () => {
      const req = {
        headers: { 'user-agent': 'test-agent' },
      } as unknown as Request;
      const recaptcha = 'test-recaptcha';

      const spy = vi
        .spyOn(authService, 'generateApiKey')
        .mockResolvedValue({ api_key: 'generated-api-key' });

      const analyticsSpy = vi.spyOn(analyticsService, 'track');

      const result = await authController.generateApiKey(recaptcha, req);

      expect(analyticsSpy).toHaveBeenCalledWith(
        EventName.GENERATE_API_KEY,
        req,
      );
      expect(spy).toHaveBeenCalledWith(recaptcha);
      expect(result).toEqual({ api_key: 'generated-api-key' });
    });
  });

  describe('submitHigherRequestLimitForm', () => {
    it('should call authService.submitHigherRequestLimitForm and redirect with correct URL', async () => {
      const higherRequestLimitDto = new HigherRequestLimitDto();
      const res = {
        redirect: vi.fn(),
      } as unknown as Response;

      const spy = vi.spyOn(authService, 'submitHigherRequestLimitForm');

      await authController.submitHigherRequestLimitForm(
        higherRequestLimitDto,
        res as unknown as Response,
      );

      expect(spy).toHaveBeenCalledWith(higherRequestLimitDto);
    });
  });
});

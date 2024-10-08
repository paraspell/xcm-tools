import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import type { JwtService } from '@nestjs/jwt';
import type { UsersService } from '../users/users.service.js';
import type { ConfigService } from '@nestjs/config';
import type { HigherRequestLimitDto } from './dto/HigherRequestLimitDto.js';
import { sendEmail } from './utils/utils.js';
import { validateRecaptcha } from '../utils/validateRecaptcha.js';

vi.mock('./utils/utils.js', () => ({
  sendEmail: vi.fn(),
}));

vi.mock('../utils/validateRecaptcha.js', () => ({
  validateRecaptcha: vi.fn(),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let jwtService: JwtService;
  let usersService: UsersService;
  let configService: ConfigService;

  beforeEach(() => {
    jwtService = {
      signAsync: vi.fn(),
      verify: vi.fn(),
    } as unknown as JwtService;

    usersService = {
      create: vi.fn(),
    } as unknown as UsersService;

    configService = {
      get: vi.fn(),
    } as unknown as ConfigService;

    authService = new AuthService(jwtService, usersService, configService);
  });

  describe('generateApiKey', () => {
    it('should throw ForbiddenException if recaptcha secret key is not set', async () => {
      vi.spyOn(configService, 'get').mockReturnValue(undefined);

      await expect(
        authService.generateApiKey('test-recaptcha'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if recaptcha verification fails', async () => {
      vi.spyOn(configService, 'get').mockReturnValue('secret-key');
      vi.mocked(validateRecaptcha).mockResolvedValue(false);

      await expect(
        authService.generateApiKey('test-recaptcha'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return an api key if recaptcha verification passes', async () => {
      const mockApiKey = 'test-api-key';
      const mockUser = { id: 'user123', requestLimit: 1000 };

      vi.spyOn(configService, 'get').mockReturnValue('secret-key');
      vi.mocked(validateRecaptcha).mockResolvedValue(true);
      const usersServiceSpy = vi
        .spyOn(usersService, 'create')
        .mockResolvedValue(mockUser);
      const jwtServiceSpy = vi
        .spyOn(jwtService, 'signAsync')
        .mockResolvedValue(mockApiKey);

      const result = await authService.generateApiKey('test-recaptcha');

      expect(usersServiceSpy).toHaveBeenCalled();
      expect(jwtServiceSpy).toHaveBeenCalledWith({
        userId: mockUser.id,
      });
      expect(result).toEqual({ api_key: mockApiKey });
    });
  });

  describe('submitHigherRequestLimitForm', () => {
    it('should throw ForbiddenException if recaptcha secret key is not set', async () => {
      vi.spyOn(configService, 'get').mockReturnValue(undefined);

      const dto: HigherRequestLimitDto = {
        email: 'test@example.com',
        reason: 'Need more requests',
        requestedLimit: '1000',
        api_key: 'valid-api-key',
        'g-recaptcha-response': 'valid-recaptcha-response',
      };

      await expect(
        authService.submitHigherRequestLimitForm(dto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if recaptcha verification fails', async () => {
      vi.spyOn(configService, 'get').mockReturnValue('secret-key');
      vi.mocked(validateRecaptcha).mockResolvedValue(false);

      const dto: HigherRequestLimitDto = {
        email: 'test@example.com',
        reason: 'Need more requests',
        requestedLimit: '1000',
        api_key: 'valid-api-key',
        'g-recaptcha-response': 'invalid-recaptcha-response',
      };

      await expect(
        authService.submitHigherRequestLimitForm(dto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should send emails if recaptcha verification passes', async () => {
      vi.spyOn(configService, 'get').mockReturnValue('secret-key');
      vi.mocked(validateRecaptcha).mockResolvedValue(true);
      const jwtServiceSpy = vi
        .spyOn(jwtService, 'verify')
        .mockReturnValue({ userId: 'user123' });

      const dto: HigherRequestLimitDto = {
        email: 'test@example.com',
        reason: 'Need more requests',
        requestedLimit: '1000',
        api_key: 'valid-api-key',
        'g-recaptcha-response': 'valid-recaptcha-response',
      };

      await authService.submitHigherRequestLimitForm(dto);

      expect(validateRecaptcha).toHaveBeenCalledWith(
        dto['g-recaptcha-response'],
        'secret-key',
      );
      expect(jwtServiceSpy).toHaveBeenCalledWith(dto.api_key);
      expect(sendEmail).toHaveBeenCalled();
    });
  });
});

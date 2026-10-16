import { InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import { describe, expect, it, vi } from 'vitest';

import { validateRecaptcha } from './validateRecaptcha.js';

vi.mock('axios');

describe('validateRecaptcha', () => {
  const mockRecaptcha = 'mock-recaptcha-token';
  const mockSecretKey = 'mock-secret-key';
  const mockAction = 'generate_api_key';

  it('should return true when recaptcha validation is successful', async () => {
    const spy = vi.spyOn(axios, 'post').mockResolvedValue({
      data: { success: true, score: 0.9, action: mockAction },
    });

    const result = await validateRecaptcha(
      mockRecaptcha,
      mockSecretKey,
      mockAction,
    );

    expect(result).toBe(true);
    expect(spy).toHaveBeenCalledWith(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: mockSecretKey,
          response: mockRecaptcha,
        },
      },
    );
  });

  it('should return false when recaptcha validation fails', async () => {
    const spy = vi.spyOn(axios, 'post').mockResolvedValue({
      data: { success: false },
    });

    const result = await validateRecaptcha(
      mockRecaptcha,
      mockSecretKey,
      mockAction,
    );

    expect(result).toBe(false);
    expect(spy).toHaveBeenCalledWith(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: mockSecretKey,
          response: mockRecaptcha,
        },
      },
    );
  });

  it('should return false when the action does not match', async () => {
    vi.spyOn(axios, 'post').mockResolvedValue({
      data: { success: true, score: 0.9, action: 'higher_request_limit' },
    });

    const result = await validateRecaptcha(
      mockRecaptcha,
      mockSecretKey,
      mockAction,
    );

    expect(result).toBe(false);
  });

  it('should return false when the score is below the threshold', async () => {
    vi.spyOn(axios, 'post').mockResolvedValue({
      data: { success: true, score: 0.3, action: mockAction },
    });

    const result = await validateRecaptcha(
      mockRecaptcha,
      mockSecretKey,
      mockAction,
    );

    expect(result).toBe(false);
  });

  it('should return false when the score is missing', async () => {
    vi.spyOn(axios, 'post').mockResolvedValue({
      data: { success: true, action: mockAction },
    });

    const result = await validateRecaptcha(
      mockRecaptcha,
      mockSecretKey,
      mockAction,
    );

    expect(result).toBe(false);
  });

  it('should throw an InternalServerErrorException when axios throws an error', async () => {
    vi.spyOn(axios, 'post').mockRejectedValue(new Error('Network Error'));

    await expect(
      validateRecaptcha(mockRecaptcha, mockSecretKey, mockAction),
    ).rejects.toThrow(InternalServerErrorException);
  });
});

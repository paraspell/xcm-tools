import { InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import { describe, expect, it, vi } from 'vitest';

import { validateRecaptcha } from './validateRecaptcha.js';

vi.mock('axios');

describe('validateRecaptcha', () => {
  const mockRecaptcha = 'mock-recaptcha-token';
  const mockSecretKey = 'mock-secret-key';

  it('should return true when recaptcha validation is successful', async () => {
    // Mock axios.post to resolve with a success response

    const spy = vi.spyOn(axios, 'post').mockResolvedValue({
      data: { success: true },
    });

    const result = await validateRecaptcha(mockRecaptcha, mockSecretKey);

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

    const result = await validateRecaptcha(mockRecaptcha, mockSecretKey);

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

  it('should throw an InternalServerErrorException when axios throws an error', async () => {
    vi.spyOn(axios, 'post').mockRejectedValue(new Error('Network Error'));

    await expect(
      validateRecaptcha(mockRecaptcha, mockSecretKey),
    ).rejects.toThrow(InternalServerErrorException);
  });
});

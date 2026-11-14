import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ParaSpellError } from '@paraspell/sdk';
import { describe, expect, it } from 'vitest';

import { handleXcmApiError } from './error-handler.js';

describe('handleXcmApiError', () => {
  it('rethrows a BadRequestException unchanged', () => {
    const original = new BadRequestException('SwapOptions are required');
    const handleError = () => handleXcmApiError(original);

    expect(handleError).toThrow(original);
    expect(handleError).toThrow(BadRequestException);
    expect(handleError).toThrow('SwapOptions are required');
    try {
      handleError();
    } catch (error) {
      expect(error).toBe(original);
      expect((error as BadRequestException).getStatus()).toBe(400);
    }
  });

  it('rethrows other HttpExceptions unchanged', () => {
    const original = new NotFoundException('Chain not found');
    const handleError = () => handleXcmApiError(original);

    expect(handleError).toThrow(original);
    try {
      handleError();
    } catch (error) {
      expect(error).toBe(original);
      expect((error as NotFoundException).getStatus()).toBe(404);
    }
  });

  it('throws BadRequestException for ParaSpell errors', () => {
    const handleError = () =>
      handleXcmApiError(new ParaSpellError('SDK error'));

    expect(handleError).toThrow(BadRequestException);
    expect(handleError).toThrow('SDK error');
  });

  it('throws InternalServerErrorException for other errors', () => {
    const handleError = () => handleXcmApiError(new Error('Unexpected error'));

    expect(handleError).toThrow(InternalServerErrorException);
    expect(handleError).toThrow('Unexpected error');
  });

  it('uses a generic message for non-error values', () => {
    const handleError = () => handleXcmApiError('Unexpected value');

    expect(handleError).toThrow(InternalServerErrorException);
    expect(handleError).toThrow('An unknown error occurred');
  });
});

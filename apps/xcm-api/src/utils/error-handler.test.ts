import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ParaSpellError } from '@paraspell/sdk';
import { describe, expect, it } from 'vitest';

import { handleXcmApiError } from './error-handler.js';

describe('handleXcmApiError', () => {
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

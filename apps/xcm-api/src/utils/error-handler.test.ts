import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  BridgeHaltedError,
  DryRunFailedError,
  DuplicateAssetError,
  DuplicateAssetIdError,
  InvalidAddressError,
  InvalidCurrencyError,
  MissingChainApiError,
  NoXCMSupportImplementedError,
  ScenarioNotSupportedError,
  TransferToAhNotSupported,
} from '@paraspell/sdk';
import { describe, expect, it } from 'vitest';

import { handleXcmApiError } from './error-handler.js';

describe('handleXcmApiError', () => {
  const sdkErrors = [
    new InvalidCurrencyError('Invalid currency'),
    new InvalidAddressError('Invalid address'),
    new NoXCMSupportImplementedError('Acala'),
    new DuplicateAssetError('2'),
    new DuplicateAssetIdError('2'),
    new ScenarioNotSupportedError({ chain: 'Acala', scenario: 'ParaToPara' }),
    new BridgeHaltedError(),
    new DryRunFailedError('Failed'),
    new TransferToAhNotSupported(),
    new MissingChainApiError('Acala'),
  ];

  it('should throw BadRequestException for known SDK errors', () => {
    sdkErrors.forEach((error) => {
      try {
        handleXcmApiError(error);
        // We should never get here if the function is working properly.
        expect.fail(
          `Expected BadRequestException for ${error.name} was not thrown`,
        );
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException);

        if (err instanceof BadRequestException) {
          expect(err.message).toBeDefined();
        }
      }
    });
  });

  it('should throw InternalServerErrorException for non-SDK Error objects', () => {
    const genericError = new Error('Some generic error');

    try {
      handleXcmApiError(genericError);
      expect.fail('Expected InternalServerErrorException was not thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(InternalServerErrorException);

      if (err instanceof InternalServerErrorException) {
        expect(err.message).toContain('Some generic error');
      }
    }
  });

  it('should throw InternalServerErrorException with "An unknown error occurred" if the input is not an Error', () => {
    const notAnError = 'Just a string';

    try {
      handleXcmApiError(notAnError);
      expect.fail('Expected InternalServerErrorException was not thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(InternalServerErrorException);

      if (err instanceof InternalServerErrorException) {
        expect(err.message).toContain('An unknown error occurred');
      }
    }
  });
});

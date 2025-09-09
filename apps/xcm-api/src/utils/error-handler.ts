import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  AmountTooLowError,
  BridgeHaltedError,
  ChainNotSupportedError,
  DryRunFailedError,
  DuplicateAssetError,
  DuplicateAssetIdError,
  IncompatibleChainsError,
  InvalidCurrencyError,
  InvalidParameterError,
  MissingChainApiError,
  NoXCMSupportImplementedError,
  ScenarioNotSupportedError,
  TransferToAhNotSupported,
  UnableToComputeError,
} from '@paraspell/sdk';
import { InvalidAddressError } from '@paraspell/sdk';

// For these errors thrown inside SDK, throw a 400 BadRequestException in API
// Otherwise throw 500 InternalServerErrorException
const sdkErrors = [
  InvalidCurrencyError,
  IncompatibleChainsError,
  InvalidAddressError,
  ChainNotSupportedError,
  NoXCMSupportImplementedError,
  ScenarioNotSupportedError,
  DuplicateAssetError,
  DuplicateAssetIdError,
  BridgeHaltedError,
  DryRunFailedError,
  TransferToAhNotSupported,
  InvalidParameterError,
  UnableToComputeError,
  MissingChainApiError,
  AmountTooLowError,
];

type SdkErrorConstructors = (typeof sdkErrors)[number];

type SdkErrorInstance = InstanceType<SdkErrorConstructors>;

const isXcmApiError = (error: unknown): error is SdkErrorInstance => {
  return sdkErrors.some((err) => error instanceof err);
};

export const handleXcmApiError = (error: unknown): never => {
  if (isXcmApiError(error)) {
    throw new BadRequestException(error.message);
  }

  if (error instanceof Error) {
    throw new InternalServerErrorException(error.message);
  }

  throw new InternalServerErrorException('An unknown error occurred');
};

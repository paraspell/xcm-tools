import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  AmountTooLowError,
  ApiNotInitializedError,
  BatchValidationError,
  BridgeHaltedError,
  CustomAssetConflictError,
  CustomChainConflictError,
  CustomChainInvalidError,
  DryRunFailedError,
  DuplicateAssetError,
  DuplicateAssetIdError,
  FeatureTemporarilyDisabledError,
  InvalidAddressError,
  InvalidCurrencyError,
  MissingChainApiError,
  MissingParameterError,
  NoXCMSupportImplementedError,
  NumberFormatError,
  OverrideConflictError,
  ProviderUnavailableError,
  RoutingResolutionError,
  RuntimeApiError,
  RuntimeApiUnavailableError,
  ScenarioNotSupportedError,
  SubmitTransactionError,
  TypeAndThenUnavailableError,
  UnableToComputeError,
  UnsupportedOperationError,
  ValidationError,
  XcmPalletNotFoundError,
} from '@paraspell/sdk';

// For these errors thrown inside SDK, throw a 400 BadRequestException in API
// Otherwise throw 500 InternalServerErrorException
const sdkErrors = [
  InvalidCurrencyError,
  InvalidAddressError,
  NoXCMSupportImplementedError,
  ScenarioNotSupportedError,
  DuplicateAssetError,
  DuplicateAssetIdError,
  BridgeHaltedError,
  DryRunFailedError,
  UnableToComputeError,
  MissingChainApiError,
  AmountTooLowError,
  MissingParameterError,
  UnsupportedOperationError,
  FeatureTemporarilyDisabledError,
  BatchValidationError,
  ProviderUnavailableError,
  RoutingResolutionError,
  OverrideConflictError,
  NumberFormatError,
  RuntimeApiUnavailableError,
  ValidationError,
  CustomChainInvalidError,
  CustomChainConflictError,
  CustomAssetConflictError,
  XcmPalletNotFoundError,
  TypeAndThenUnavailableError,
  ApiNotInitializedError,
  RuntimeApiError,
  SubmitTransactionError,
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

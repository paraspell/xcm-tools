import type { TLocation } from '@paraspell/sdk';
import {
  Foreign,
  ForeignAbstract,
  type GeneralBuilder,
  getOtherAssets,
  isRelayChain,
  Native,
  Override,
  type TBuilderConfig,
  type TCurrencyCore,
  type TCurrencyInput,
  type TUrl,
  type WithComplexAmount,
} from '@paraspell/sdk';

import type {
  TCurrencyEntryTransformed,
  TFormValuesTransformed,
} from '../components/XcmTransfer/XcmTransferForm';
import type { TAdvancedOptions } from '../types';

// Transforms apiOverrides array used by URL params to Record used by the SDK
export const transformApiOverrides = (
  apiOverrides: TAdvancedOptions['apiOverrides'],
): TBuilderConfig<TUrl>['apiOverrides'] =>
  Object.fromEntries(
    apiOverrides
      .filter(({ endpoints }) => endpoints.length > 0)
      .map(({ chain, endpoints }) => [chain, endpoints.map((e) => e.url)]),
  );

export const createBuilderOptions = ({
  apiOverrides,
  development,
  abstractDecimals,
  xcmFormatCheck,
}: TAdvancedOptions): TBuilderConfig<TUrl> => ({
  apiOverrides: transformApiOverrides(apiOverrides),
  development,
  abstractDecimals,
  xcmFormatCheck,
});

export const determineCurrency = (
  { from }: TFormValuesTransformed,
  {
    isCustomCurrency,
    customCurrency,
    customCurrencyType,
    customCurrencySymbolSpecifier,
    currency,
  }: TCurrencyEntryTransformed,
): TCurrencyInput => {
  if (isCustomCurrency) {
    if (customCurrencyType === 'id') {
      return {
        id: customCurrency,
      };
    } else if (customCurrencyType === 'symbol') {
      if (customCurrencySymbolSpecifier === 'native') {
        return {
          symbol: Native(customCurrency),
        };
      }

      if (customCurrencySymbolSpecifier === 'foreign') {
        return {
          symbol: Foreign(customCurrency),
        };
      }

      if (customCurrencySymbolSpecifier === 'foreignAbstract') {
        return {
          symbol: ForeignAbstract(customCurrency),
        };
      }

      return {
        symbol: customCurrency,
      };
    } else if (customCurrencyType === 'overridenLocation') {
      return {
        location: Override(JSON.parse(customCurrency) as TLocation),
      };
    } else {
      return {
        location: JSON.parse(customCurrency) as TLocation,
      };
    }
  } else if (currency) {
    const hasDuplicateIds = isRelayChain(from)
      ? false
      : getOtherAssets(from).filter(
          (asset) =>
            !asset.isNative &&
            !currency.isNative &&
            asset.assetId === currency.assetId,
        ).length > 1;

    if (!currency.isNative && currency.assetId && !hasDuplicateIds) {
      return {
        id: currency.assetId,
      };
    }

    if (currency.location) {
      return {
        location: currency.location,
      };
    }

    return currency.isNative
      ? { symbol: Native(currency.symbol) }
      : { symbol: currency.symbol };
  } else {
    throw Error('Currency is required');
  }
};

export const determineFeeAsset = (
  formValues: TFormValuesTransformed,
  transformedFeeAsset?: TCurrencyEntryTransformed,
): TCurrencyInput | undefined => {
  if (!transformedFeeAsset) return undefined;

  if (
    transformedFeeAsset.currencyOptionId ||
    transformedFeeAsset.isCustomCurrency
  ) {
    return determineCurrency(formValues, transformedFeeAsset);
  }
  return undefined;
};

export const setupBaseBuilder = (
  builder: GeneralBuilder,
  formValues: TFormValuesTransformed,
  senderAddress: string,
) => {
  const {
    from,
    to,
    address,
    ahAddress,
    xcmVersion,
    keepAlive,
    pallet,
    method,
    transactOptions,
    transformedFeeAsset,
  } = formValues;

  const currencyInputs = formValues.currencies.map((c) => ({
    ...determineCurrency(formValues, c),
    amount: c.amount,
  }));

  let finalBuilder = builder
    .from(from)
    .to(to)
    .currency(
      currencyInputs.length === 1
        ? currencyInputs[0]
        : (currencyInputs as WithComplexAmount<TCurrencyCore>[]),
    )
    .feeAsset(determineFeeAsset(formValues, transformedFeeAsset))
    .address(address)
    .senderAddress(senderAddress)
    .ahAddress(ahAddress);

  if (xcmVersion) {
    finalBuilder = finalBuilder.xcmVersion(xcmVersion);
  }

  if (keepAlive) {
    finalBuilder = finalBuilder.keepAlive(keepAlive);
  }

  if (pallet && method) {
    finalBuilder = finalBuilder.customPallet(pallet, method);
  }

  if (transactOptions.call) {
    const { call, originKind, maxWeight } = transactOptions;
    const weight =
      maxWeight?.proofSize && maxWeight.refTime
        ? {
            refTime: BigInt(maxWeight.refTime),
            proofSize: BigInt(maxWeight.proofSize),
          }
        : undefined;
    finalBuilder = finalBuilder.transact(call, originKind, weight);
  }

  return finalBuilder;
};

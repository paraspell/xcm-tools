import type { TAssetInfo, TLocation } from '@paraspell/sdk';
import {
  Foreign,
  ForeignAbstract,
  type GeneralBuilder,
  Native,
  Override,
  type TBuilderConfig,
  type TCurrencyCore,
  type TCurrencyInput,
  type TUrl,
  type WithComplexAmount,
} from '@paraspell/sdk';
import type { Signer } from '@polkadot/api/types';
import type { PolkadotSigner } from 'polkadot-api';

import type {
  TAdvancedOptions,
  TCurrencyEntryBase,
  TCurrencyEntryBaseTransformed,
  TFormValuesTransformed,
} from '../types';
import { resolveExchange } from './routerUtils';

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

export const resolveCurrencyAsset = <T extends TCurrencyEntryBase>(
  entry: T,
  currencyMap: Record<string, TAssetInfo>,
): T & { currency?: TAssetInfo } => {
  if (entry.isCustomCurrency) {
    return { ...entry };
  }

  const currency = currencyMap[entry.currencyOptionId];
  return currency ? { ...entry, currency } : { ...entry };
};

export const determineCurrencyCore = ({
  isCustomCurrency,
  customCurrency,
  customCurrencyType,
  customCurrencySymbolSpecifier,
  currency,
}: TCurrencyEntryBaseTransformed): TCurrencyCore => {
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
    } else {
      return {
        location: JSON.parse(customCurrency) as TLocation,
      };
    }
  } else if (currency) {
    return {
      location: currency.location,
    };
  } else {
    throw Error('Currency is required');
  }
};

export const determineCurrency = (
  entry: TCurrencyEntryBaseTransformed,
): TCurrencyInput => {
  if (
    entry.isCustomCurrency &&
    entry.customCurrencyType === 'overridenLocation'
  ) {
    return {
      location: Override(JSON.parse(entry.customCurrency) as TLocation),
    };
  }
  return determineCurrencyCore(entry);
};

export const determineFeeAsset = (
  transformedFeeAsset?: TCurrencyEntryBaseTransformed,
): TCurrencyInput | undefined => {
  if (!transformedFeeAsset) return undefined;

  if (
    transformedFeeAsset.currencyOptionId ||
    transformedFeeAsset.isCustomCurrency
  ) {
    return determineCurrency(transformedFeeAsset);
  }
  return undefined;
};

export const setupBaseBuilder = (
  builder: GeneralBuilder,
  formValues: TFormValuesTransformed,
  senderAddress: string,
  signer: PolkadotSigner | Signer,
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
    ...determineCurrency(c),
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
    .feeAsset(determineFeeAsset(transformedFeeAsset))
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

  if (
    formValues.transformedCurrencyTo?.isCustomCurrency ||
    formValues.transformedCurrencyTo?.currency
  ) {
    const { exchange, slippage, evmSigner, evmInjectorAddress } =
      formValues.swapOptions;

    // Swap operation is only supported for PAPI, we can safely cast to PAPI signer
    finalBuilder = finalBuilder.senderAddress(signer as PolkadotSigner).swap({
      currencyTo: determineCurrencyCore(formValues.transformedCurrencyTo),
      exchange: resolveExchange(exchange),
      slippage: Number(slippage),
      evmSigner,
      evmSenderAddress: evmInjectorAddress || undefined,
    });
  }

  return finalBuilder;
};

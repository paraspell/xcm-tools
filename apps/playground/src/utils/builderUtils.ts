import type {
  TAssetInfo,
  TLocation,
  TPapiApi,
  TPapiSigner,
  TPapiTransaction,
  TTransferBaseOptionsWithSender,
} from '@paraspell/sdk';
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
  TSwapOptions,
  TSymbolType,
  TTransferCurrencyType,
} from '../types';

export const isSwapActive = (swapOptions: TSwapOptions): boolean =>
  !!(
    swapOptions.currencyTo.currencyOptionId ||
    swapOptions.currencyTo.isCustomCurrency
  );

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

export const resolveCustomCurrencyCore = (
  currency: string,
  currencyType?: TTransferCurrencyType,
  currencySymbolSpecifier?: TSymbolType,
): TCurrencyCore => {
  if (currencyType === 'id') {
    return { id: currency };
  }

  if (currencyType === 'symbol') {
    if (currencySymbolSpecifier === 'native') {
      return { symbol: Native(currency) };
    }

    if (currencySymbolSpecifier === 'foreign') {
      return { symbol: Foreign(currency) };
    }

    if (currencySymbolSpecifier === 'foreignAbstract') {
      return { symbol: ForeignAbstract(currency) };
    }

    return { symbol: currency };
  }

  return {
    location: JSON.parse(currency) as TLocation,
  };
};

export const determineCurrencyCore = ({
  isCustomCurrency,
  customCurrency,
  customCurrencyType,
  customCurrencySymbolSpecifier,
  currency,
}: TCurrencyEntryBaseTransformed): TCurrencyCore => {
  if (isCustomCurrency) {
    return resolveCustomCurrencyCore(
      customCurrency,
      customCurrencyType,
      customCurrencySymbolSpecifier,
    );
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

export const buildApiPayload = (
  formValues: TFormValuesTransformed,
  sender: string,
  options?: TBuilderConfig<TUrl>,
) => {
  const {
    useApi,
    currencies,
    apiOverrides,
    development,
    feeAsset,
    transformedFeeAsset,
    abstractDecimals,
    swapOptions,
    ...safeFormValues
  } = formValues;

  const currencyInputs = currencies.map((c) => ({
    ...determineCurrency(c),
    amount: c.isMax ? 'ALL' : c.amount,
  }));

  return {
    ...safeFormValues,
    ...(options !== undefined ? { options } : {}),
    sender,
    currency: currencyInputs.length === 1 ? currencyInputs[0] : currencyInputs,
    feeAsset: determineFeeAsset(transformedFeeAsset),
    ...(formValues.transformedCurrencyTo?.currencyOptionId ||
    formValues.transformedCurrencyTo?.isCustomCurrency
      ? {
          swapOptions: {
            ...formValues.swapOptions,
            currencyTo: determineCurrency(formValues.transformedCurrencyTo),
          },
        }
      : {}),
  };
};

export const addSwapToBuilder = <
  T extends Partial<
    TTransferBaseOptionsWithSender<TPapiApi, TPapiTransaction, TPapiSigner>
  >,
>(
  builder: GeneralBuilder<T>,
  transformedCurrencyTo: TCurrencyEntryBaseTransformed,
  swapOptions: TSwapOptions,
  signer: PolkadotSigner | Signer,
  sender: string,
) => {
  const { exchange, slippage, evmSigner, evmInjectorAddress } = swapOptions;

  return builder
    .sender({ ...signer, address: sender } as unknown as PolkadotSigner)
    .swap({
      currencyTo: determineCurrencyCore(transformedCurrencyTo),
      exchange,
      slippage: Number(slippage),
      evmSigner,
      evmSenderAddress: evmInjectorAddress || undefined,
    });
};

export const setupBaseBuilder = (
  builder: GeneralBuilder,
  formValues: TFormValuesTransformed,
  sender: string,
  signer: PolkadotSigner | Signer,
) => {
  const {
    from,
    to,
    recipient,
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
    .sender(sender)
    .recipient(recipient)
    .ahAddress(ahAddress);

  if (xcmVersion) {
    finalBuilder = finalBuilder.xcmVersion(xcmVersion);
  }

  finalBuilder = finalBuilder.keepAlive(keepAlive);

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
    finalBuilder = addSwapToBuilder(
      finalBuilder,
      formValues.transformedCurrencyTo,
      formValues.swapOptions,
      signer,
      sender,
    );
  }

  return finalBuilder;
};

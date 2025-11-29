import type { UseFormReturnType } from '@mantine/form';
import { isRelayChain } from '@paraspell/sdk';
import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import type { FormValues as AssetClaimFormValues } from '../components/AssetClaim/AssetClaimForm';
import type { FormValues as AssetQueryFormValues } from '../components/AssetsQueries/AssetsQueriesForm';
import type { FormValues as EvmTransferFormValues } from '../components/EvmTransfer/EvmTransferForm';
import type { FormValues as PalletQueryFormValues } from '../components/PalletsQueries/PalletsQueriesForm';
import type { FormValues as XcmAnalyserFormValues } from '../components/XcmAnalyser/XcmAnalyserForm';
import type { TRouterFormValues } from '../components/XcmRouter/XcmRouterForm';
import type { FormValues as XcmTransferFormValues } from '../components/XcmTransfer/XcmTransferForm';
import {
  encodeApiType,
  encodeBoolean,
  encodeCodeString,
  encodeCurrencyList,
  encodeExchanges,
  encodeFeeAsset,
  encodeString,
  encodeStringOrUndefined,
  setOrDelete,
} from '../utils/routes/urlFilters';
import {
  useAssetClaimState,
  useAssetQueryState,
  useEvmTransferState,
  usePalletQueryState,
  useSelectedApiType,
  useXcmAnalyserState,
  useXcmRouterState,
  useXcmTransferState,
} from '.';

type EncoderFunction<T = unknown> = (value: T) => string | undefined;

interface FilterConfig<TState = unknown> {
  paramName: string;
  getValue: (state: TState, formValues?: Record<string, unknown>) => unknown;
  encoder: EncoderFunction<unknown>;
  shouldInclude?: (
    state: TState,
    formValues?: Record<string, unknown>,
  ) => boolean;
}

interface UseFilterSyncOptions<
  TState = unknown,
  TFormValues extends Record<string, unknown> = Record<string, unknown>,
> {
  state: TState;
  form?: UseFormReturnType<TFormValues>;
  filters: FilterConfig<TState>[];
}

function useFilterSync<
  TState = unknown,
  TFormValues extends Record<string, unknown> = Record<string, unknown>,
>({ state, filters, form }: UseFilterSyncOptions<TState, TFormValues>) {
  const [searchParams, setSearchParams] = useSearchParams();
  const formValues = form?.getValues();

  const encoded = useMemo(() => {
    const result: Record<string, string | undefined> = {};

    filters.forEach(({ paramName, getValue, encoder, shouldInclude }) => {
      if (shouldInclude && !shouldInclude(state, formValues)) {
        result[paramName] = undefined;
        return;
      }

      const value = getValue(state, formValues);
      result[paramName] = encoder(value);
    });

    return result;
  }, [state, formValues, filters]);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);

    filters.forEach(({ paramName }) => {
      setOrDelete(next, paramName, encoded[paramName]);
    });

    const changed = next.toString() !== searchParams.toString();
    if (changed) {
      setSearchParams(next, { replace: true });
    }
  }, [encoded, searchParams, setSearchParams, filters]);
}

class FilterSyncBuilder<TState = unknown> {
  private filters: FilterConfig<TState>[] = [];

  addFilter<K extends keyof TState>(
    paramName: string,
    stateKey: K,
    encoder: EncoderFunction<TState[K]>,
    formKey?: string,
    shouldInclude?: (
      state: TState,
      formValues?: Record<string, unknown>,
    ) => boolean,
  ): this {
    this.filters.push({
      paramName,
      getValue: (state, formValues) => {
        const fKey = (formKey ?? stateKey) as string;
        return (formValues?.[fKey] ?? state[stateKey]) as TState[K];
      },
      encoder: encoder as EncoderFunction<unknown>,
      shouldInclude,
    });
    return this;
  }
  build(): FilterConfig<TState>[] {
    return this.filters;
  }
}

export function useSelectedApiTypeFilterSync() {
  const selectedApiTypeState = useSelectedApiType();

  const filters = useMemo(
    () =>
      new FilterSyncBuilder<typeof selectedApiTypeState>()
        .addFilter('apiType', 'selectedApiType', encodeApiType)
        .build(),
    [],
  );

  useFilterSync({
    state: { ...selectedApiTypeState },
    filters,
  });
}

export function useXcmTransferFilterSync(
  form?: UseFormReturnType<XcmTransferFormValues>,
) {
  const xcmState = useXcmTransferState();

  const filters = useMemo(
    () =>
      new FilterSyncBuilder<typeof xcmState>()
        .addFilter('from', 'from', encodeString)
        .addFilter('to', 'to', encodeString)
        .addFilter('currencies', 'currencies', encodeCurrencyList)
        .addFilter('feeAsset', 'feeAsset', encodeFeeAsset)
        .addFilter('address', 'address', encodeString)
        .addFilter('ahAddress', 'ahAddress', encodeString)
        .addFilter('useApi', 'useApi', encodeBoolean)
        .addFilter('useXcmFormatCheck', 'useXcmFormatCheck', encodeBoolean)
        .build(),
    [],
  );

  useFilterSync({
    state: { ...xcmState },
    filters,
    form,
  });
}

export function useEvmTransferFilterSync(
  form?: UseFormReturnType<EvmTransferFormValues>,
) {
  const evmState = useEvmTransferState();

  const filters = useMemo(
    () =>
      new FilterSyncBuilder<typeof evmState>()
        .addFilter('from', 'from', encodeString)
        .addFilter('to', 'to', encodeString)
        .addFilter('currencyOptionId', 'currencyOptionId', encodeString)
        .addFilter('address', 'address', encodeString)
        .addFilter('ahAddress', 'ahAddress', encodeString)
        .addFilter('amount', 'amount', encodeString)
        .addFilter('useViem', 'useViem', encodeBoolean)
        .build(),
    [],
  );

  useFilterSync({
    state: { ...evmState },
    filters,
    form,
  });
}

export function useAssetQueryFilterSync(
  form?: UseFormReturnType<AssetQueryFormValues>,
) {
  const assetQueryState = useAssetQueryState();

  const filters = useMemo(
    () =>
      new FilterSyncBuilder<typeof assetQueryState>()
        .addFilter('func', 'func', encodeString)
        .addFilter(
          'chain',
          'chain',
          encodeString,
          undefined,
          (state, formValues) => {
            //We do not want to display this field in the url if the field component is not rendered,
            // this is the duplicated logic from the Form component,
            // if this logic changes often, it probably would be better to abstract it
            const func =
              (formValues as AssetQueryFormValues | undefined)?.func ??
              state.func;
            const shouldHideChain =
              func === 'ETHEREUM_BRIDGE_STATUS' || func === 'PARA_ETH_FEES';
            return !shouldHideChain;
          },
        )
        .addFilter(
          'destination',
          'destination',
          encodeString,
          undefined,
          (state, formValues) => {
            const func =
              (formValues as AssetQueryFormValues | undefined)?.func ??
              state.func;
            return func === 'SUPPORTED_ASSETS' || func === 'ASSET_INFO';
          },
        )
        .addFilter(
          'currency',
          'currency',
          encodeString,
          undefined,
          (state, formValues) => {
            const typedFormValues = formValues as
              | AssetQueryFormValues
              | undefined;
            const func = typedFormValues?.func ?? state.func;
            const currencyType =
              typedFormValues?.currencyType ?? state.currencyType;

            const showSymbolInput =
              func === 'ASSET_ID' ||
              func === 'ASSET_LOCATION' ||
              func === 'ASSET_INFO' ||
              func === 'DECIMALS' ||
              func === 'HAS_SUPPORT' ||
              func === 'ASSET_BALANCE' ||
              func === 'EXISTENTIAL_DEPOSIT' ||
              func === 'SUPPORTED_DESTINATIONS';

            if (!showSymbolInput) return false;

            return (
              currencyType === 'id' ||
              currencyType === 'symbol' ||
              currencyType === 'location'
            );
          },
        )
        .addFilter(
          'address',
          'address',
          encodeString,
          undefined,
          (state, formValues) => {
            const func =
              (formValues as AssetQueryFormValues | undefined)?.func ??
              state.func;
            return func === 'ASSET_BALANCE' || func === 'CONVERT_SS58';
          },
        )
        .addFilter('useApi', 'useApi', encodeBoolean)
        .addFilter(
          'currencyType',
          'currencyType',
          encodeStringOrUndefined,
          undefined,
          (state, formValues) => {
            const typedFormValues = formValues as
              | AssetQueryFormValues
              | undefined;
            const func = typedFormValues?.func ?? state.func;
            const chain = typedFormValues?.chain ?? state.chain;

            const supportsCurrencyType =
              func === 'ASSET_LOCATION' ||
              func === 'ASSET_INFO' ||
              func === 'ASSET_BALANCE' ||
              func === 'EXISTENTIAL_DEPOSIT' ||
              func === 'SUPPORTED_DESTINATIONS';

            if (!supportsCurrencyType) return false;

            const isRelay = isRelayChain(chain);
            return !isRelay;
          },
        )
        .addFilter(
          'customCurrencySymbolSpecifier',
          'customCurrencySymbolSpecifier',
          encodeStringOrUndefined,
          undefined,
          (state, formValues) => {
            const typedFormValues = formValues as
              | AssetQueryFormValues
              | undefined;
            const func = typedFormValues?.func ?? state.func;
            const chain = typedFormValues?.chain ?? state.chain;
            const currencyType =
              typedFormValues?.currencyType ?? state.currencyType;

            const supportsCurrencyType =
              func === 'ASSET_LOCATION' ||
              func === 'ASSET_INFO' ||
              func === 'ASSET_BALANCE' ||
              func === 'EXISTENTIAL_DEPOSIT' ||
              func === 'SUPPORTED_DESTINATIONS';

            if (!supportsCurrencyType) return false;

            const isRelay = isRelayChain(chain);
            return currencyType === 'symbol' && !isRelay;
          },
        )
        .build(),
    [],
  );

  useFilterSync({
    state: { ...assetQueryState },
    filters,
    form,
  });
}

export function usePalletQueryFilterSync(
  form?: UseFormReturnType<PalletQueryFormValues>,
) {
  const palletQueryState = usePalletQueryState();

  const filters = useMemo(
    () =>
      new FilterSyncBuilder<typeof palletQueryState>()
        .addFilter('func', 'func', encodeString)
        .addFilter('chain', 'chain', encodeString)
        .addFilter(
          'pallet',
          'pallet',
          encodeString,
          undefined,
          (state, formValues) => {
            const func =
              (formValues as PalletQueryFormValues | undefined)?.func ??
              state.func;
            return func === 'PALLET_INDEX';
          },
        )
        .addFilter('useApi', 'useApi', encodeBoolean)
        .build(),
    [],
  );

  useFilterSync({
    state: { ...palletQueryState },
    filters,
    form,
  });
}

export function useAssetClaimFilterSync(
  form?: UseFormReturnType<AssetClaimFormValues>,
) {
  const assetClaimState = useAssetClaimState();

  const filters = useMemo(
    () =>
      new FilterSyncBuilder<typeof assetClaimState>()
        .addFilter('from', 'from', encodeString)
        .addFilter('address', 'address', encodeString)
        .addFilter('amount', 'amount', encodeString)
        .addFilter('useApi', 'useApi', encodeBoolean)
        .build(),
    [],
  );

  useFilterSync({
    state: { ...assetClaimState },
    filters,
    form,
  });
}

export function useXcmRouterFilterSync(
  form?: UseFormReturnType<TRouterFormValues>,
) {
  const xcmRouterState = useXcmRouterState();

  const filters = useMemo(
    () =>
      new FilterSyncBuilder<typeof xcmRouterState>()
        .addFilter('from', 'from', encodeString)
        .addFilter('exchange', 'exchange', encodeExchanges)
        .addFilter('to', 'to', encodeString)
        .addFilter('currencyFromOptionId', 'currencyFromOptionId', encodeString)
        .addFilter('currencyToOptionId', 'currencyToOptionId', encodeString)
        .addFilter('recipientAddress', 'recipientAddress', encodeString)
        .addFilter('amount', 'amount', encodeString)
        .addFilter('slippagePct', 'slippagePct', encodeString)
        .addFilter('useApi', 'useApi', encodeBoolean)
        .build(),
    [],
  );

  useFilterSync({
    state: { ...xcmRouterState },
    filters,
    form,
  });
}

export function useXcmAnalyserFilterSync(
  form?: UseFormReturnType<XcmAnalyserFormValues>,
) {
  const xcmAnalyserState = useXcmAnalyserState();

  const filters = useMemo(
    () =>
      new FilterSyncBuilder<typeof xcmAnalyserState>()
        .addFilter('input', 'input', encodeCodeString)
        .addFilter('useApi', 'useApi', encodeBoolean)
        .build(),
    [],
  );

  useFilterSync({
    state: { ...xcmAnalyserState },
    filters,
    form,
  });
}

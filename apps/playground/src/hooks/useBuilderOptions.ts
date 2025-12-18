import type { TBuilderConfig, TChain } from '@paraspell/sdk';
import { useMemo } from 'react';

import type {
  AdvancedBaseOptions,
  AdvancedOptions,
} from '../components/AdvancedOptionsAccordion/AdvancedOptionsAccordion';

type TBuilderOptionsQuery = AdvancedOptions | AdvancedBaseOptions;

type TAdvancedBuilderOptions<TApi = string | string[]> = Omit<
  TBuilderConfig<TApi>,
  'xcmFormatCheck'
>;

export const useBuilderOptions = <TApi = string | string[]>(
  query: TBuilderOptionsQuery,
): TAdvancedBuilderOptions<TApi> => {
  return useMemo<TAdvancedBuilderOptions<TApi>>(() => {
    const apiOverrides =
      query.customEndpoints && query.customEndpoints.length > 0
        ? query.customEndpoints.reduce(
            (acc, ep) => {
              if (ep.chain) {
                acc[ep.chain] = (ep.endpoints?.map((e) => e.value) ??
                  []) as TApi;
              }
              return acc;
            },
            {} as Partial<Record<TChain, TApi>>,
          )
        : undefined;

    return {
      abstractDecimals: query.abstractDecimals ?? true,
      development: query.isDevelopment ?? false,
      apiOverrides,
    };
  }, [query.abstractDecimals, query.isDevelopment, query.customEndpoints]);
};

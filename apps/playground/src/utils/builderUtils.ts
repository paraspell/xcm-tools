import type { TBuilderConfig, TUrl } from '@paraspell/sdk';

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

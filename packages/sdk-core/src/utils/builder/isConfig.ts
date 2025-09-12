import type { TBuilderConfig } from '../../types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isConfig = <TApi>(value: any): value is TBuilderConfig<TApi> =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  (Object.keys(value).length < 3 ||
    'apiOverrides' in value ||
    'development' in value ||
    'abstractDecimals' in value ||
    'xcmFormatCheck' in value)

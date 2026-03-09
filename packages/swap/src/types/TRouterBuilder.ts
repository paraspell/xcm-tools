import type { TBuilderConfig, TUrl } from '@paraspell/sdk';

export type TRouterBuilderOptions = Omit<TBuilderConfig<TUrl>, 'xcmFormatCheck'>;

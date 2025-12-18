import { Version } from '@paraspell/sdk';
import {
  parseAsBoolean,
  parseAsJson,
  parseAsNativeArrayOf,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from 'nuqs';

import { TCustomEndpointSchema } from '../components/AdvancedOptionsAccordion/AdvancedOptionsAccordion';

const advancedBaseOptionsQueryConfig = {
  isDevelopment: parseAsBoolean.withDefault(false),
  abstractDecimals: parseAsBoolean.withDefault(true),
  customEndpoints: parseAsNativeArrayOf(
    parseAsJson(TCustomEndpointSchema),
  ).withDefault([]),
};

const advancedOptionsQueryConfig = {
  xcmVersion: parseAsStringLiteral(Object.values(Version)),
  pallet: parseAsString.withDefault(''),
  method: parseAsString.withDefault(''),
  ...advancedBaseOptionsQueryConfig,
};

export const useAdvancedBaseOptionsQuery = () => {
  return useQueryStates(advancedBaseOptionsQueryConfig, { shallow: false });
};

export const useAdvancedOptionsQuery = () => {
  return useQueryStates(advancedOptionsQueryConfig, { shallow: false });
};

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

const advancedRouterOptionsQueryConfig = {
  isDevelopment: parseAsBoolean.withDefault(false),
  abstractDecimals: parseAsBoolean.withDefault(true),
  customEndpoints: parseAsNativeArrayOf(
    parseAsJson(TCustomEndpointSchema),
  ).withDefault([]),
};

const advancedOptionsQueryConfig = {
  xcmVersion: parseAsStringLiteral(Object.values(Version)).withDefault(
    Version.V3,
  ),
  pallet: parseAsString.withDefault(''),
  method: parseAsString.withDefault(''),
  ...advancedRouterOptionsQueryConfig,
};

export const useAdvancedRouterOptionsQuery = () => {
  return useQueryStates(advancedRouterOptionsQueryConfig, { shallow: false });
};

export const useAdvancedOptionsQuery = () => {
  return useQueryStates(advancedOptionsQueryConfig, { shallow: false });
};

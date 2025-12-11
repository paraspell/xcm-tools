import { Version } from '@paraspell/sdk';
import {
  parseAsBoolean,
  parseAsJson,
  parseAsNativeArrayOf,
  parseAsString,
  parseAsStringLiteral,
} from 'nuqs';

import { CustomEndpointSchema } from '../utils';

export const advancedOptionsParsers = {
  apiOverrides: parseAsNativeArrayOf(
    parseAsJson(CustomEndpointSchema),
  ).withDefault([]),
  development: parseAsBoolean.withDefault(false),
  abstractDecimals: parseAsBoolean.withDefault(true),
  xcmFormatCheck: parseAsBoolean.withDefault(false),
  localAccount: parseAsString.withDefault(''),
  xcmVersion: parseAsStringLiteral(Object.values(Version)),
  pallet: parseAsString.withDefault(''),
  method: parseAsString.withDefault(''),
};

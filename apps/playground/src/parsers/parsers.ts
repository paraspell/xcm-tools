import { TRANSACT_ORIGINS, Version } from '@paraspell/sdk';
import { EXCHANGE_CHAINS } from '@paraspell/sdk';
import {
  createParser,
  parseAsBoolean,
  parseAsJson,
  parseAsNativeArrayOf,
  parseAsString,
  parseAsStringLiteral,
} from 'nuqs';
import z from 'zod';

import {
  DEFAULT_SWAP_OPTIONS,
  DEFAULT_TRANSACT_OPTIONS,
  SYMBOL_TYPES,
  TRANSFER_CURRENCY_TYPES,
} from '../constants';
import { CustomEndpointSchema, isValidWalletAddress } from '../utils';

export const CurrencyEntrySchema = z.object({
  currencyOptionId: z.string(),
  customCurrency: z.string(),
  amount: z.string(),
  isCustomCurrency: z.boolean(),
  isMax: z.boolean().optional(),
  customCurrencyType: z.enum(TRANSFER_CURRENCY_TYPES).optional(),
  customCurrencySymbolSpecifier: z.enum(SYMBOL_TYPES).optional(),
});

export const FeeAssetSchema = CurrencyEntrySchema.omit({
  amount: true,
  isMax: true,
});

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

const WeightSchema = z.object({
  refTime: z.number().or(z.string()),
  proofSize: z.number().or(z.string()),
});

// This schema is duplicated in xcm-api
// Refactor to a shared location in the future if needed
export const TransactOptionsSchema = z.object({
  call: z.string(),
  originKind: z.enum(TRANSACT_ORIGINS).optional(),
  maxWeight: WeightSchema.optional(),
});

export const transactOptionsParsers = {
  transactOptions: parseAsJson(TransactOptionsSchema).withDefault(
    DEFAULT_TRANSACT_OPTIONS,
  ),
};

const SwapOptionsSchema = z.object({
  currencyTo: FeeAssetSchema,
  exchange: z.array(z.enum(EXCHANGE_CHAINS)),
  slippage: z.string(),
  evmInjectorAddress: z.string().optional(),
});

export const swapOptionsParsers = {
  swapOptions: parseAsJson(SwapOptionsSchema).withDefault(DEFAULT_SWAP_OPTIONS),
};

export const parseAsWalletAddress = createParser({
  parse: (query) => {
    return query !== null && isValidWalletAddress(query) ? query : null;
  },
  serialize: (value) => value,
});

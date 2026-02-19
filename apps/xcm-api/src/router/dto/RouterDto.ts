import { z } from 'zod';

import { validateAmount } from '../../utils/validateAmount.js';
import {
  BuilderOptionsSchema,
  CurrencyCoreSchema,
} from '../../x-transfer/dto/XTransferDto.js';

export const RouterDtoSchema = z.object({
  from: z.string().nullable().optional(),
  exchange: z
    .union([
      z.string(),
      z
        .array(z.string())
        .min(2, { message: 'Exchange array must contain at least 2 strings' }),
    ])
    .optional(),
  to: z.string().nullable().optional(),
  currencyFrom: CurrencyCoreSchema,
  currencyTo: CurrencyCoreSchema,
  feeAsset: CurrencyCoreSchema.optional(),
  recipientAddress: z
    .string()
    .min(1, { message: 'Recipient address is required' }),
  senderAddress: z.string().min(1, { message: 'Sender address is required' }),
  evmSenderAddress: z
    .string()
    .min(1, 'Evm sender address is required')
    .optional(),
  assetHubAddress: z
    .string()
    .min(1, 'Asset hub address is required')
    .optional(),
  amount: z.union([
    z.string().refine(validateAmount, {
      message: 'Amount must be a positive number',
    }),
    z.number().positive({ message: 'Amount must be a positive number' }),
  ]),
  slippagePct: z.string().optional(),
  options: BuilderOptionsSchema.omit({ xcmFormatCheck: true }).optional(),
});

export const RouterBestAmountOutSchema = RouterDtoSchema.pick({
  from: true,
  exchange: true,
  to: true,
  currencyFrom: true,
  currencyTo: true,
  amount: true,
  options: true,
});

export const ExchangePairsSchema = RouterDtoSchema.pick({
  exchange: true,
});

export type RouterDto = z.infer<typeof RouterDtoSchema>;
export type RouterBestAmountOutDto = z.infer<typeof RouterBestAmountOutSchema>;
export type ExchangePairsDto = z.infer<typeof ExchangePairsSchema>;

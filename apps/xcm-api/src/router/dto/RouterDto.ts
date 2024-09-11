import { z } from 'zod';
import { CurrencyCoreSchema } from '../../x-transfer/dto/XTransferDto.js';
import { TCurrencyCore } from '@paraspell/sdk';
import { TransactionType } from '@paraspell/xcm-router';

export const RouterDtoSchema = z.object({
  from: z.string(),
  exchange: z.string().optional(),
  to: z.string(),
  currencyFrom: CurrencyCoreSchema,
  currencyTo: CurrencyCoreSchema,
  recipientAddress: z
    .string()
    .min(1, { message: 'Recipient address is required' }),
  injectorAddress: z
    .string()
    .min(1, { message: 'Injector address is required' }),
  evmInjectorAddress: z
    .string()
    .min(1, 'Evm injector address is required')
    .optional(),
  assetHubAddress: z
    .string()
    .min(1, 'Asset hub address is required')
    .optional(),
  amount: z.union([
    z.string().refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num > 0;
      },
      {
        message: 'Amount must be a positive number',
      },
    ),
    z.number().positive({ message: 'Amount must be a positive number' }),
  ]),
  slippagePct: z.string().optional(),
  type: z.nativeEnum(TransactionType).optional(),
});

export type RouterDto = z.infer<typeof RouterDtoSchema>;

export type PatchedRouterDto = RouterDto & {
  currencyFrom: TCurrencyCore;
  currencyTo: TCurrencyCore;
  recipientAddress: string;
  injectorAddress: string;
};

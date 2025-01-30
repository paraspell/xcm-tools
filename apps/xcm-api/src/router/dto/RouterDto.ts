import { z } from 'zod';
import { CurrencyCoreSchemaV1 } from '../../x-transfer/dto/XTransferDto.js';
import { validateAmount } from '../../utils/validateAmount.js';

export const RouterDtoSchema = z.object({
  from: z.string(),
  exchange: z.string().optional(),
  to: z.string(),
  currencyFrom: CurrencyCoreSchemaV1,
  currencyTo: CurrencyCoreSchemaV1,
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
    z.string().refine(validateAmount, {
      message: 'Amount must be a positive number',
    }),
    z.number().positive({ message: 'Amount must be a positive number' }),
  ]),
  slippagePct: z.string().optional(),
});

export type RouterDto = z.infer<typeof RouterDtoSchema>;

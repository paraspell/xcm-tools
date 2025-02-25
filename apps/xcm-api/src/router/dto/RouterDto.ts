import { z } from 'zod';
import { CurrencyCoreSchema } from '../../x-transfer/dto/XTransferDto.js';
import { validateAmount } from '../../utils/validateAmount.js';

export const RouterDtoSchema = z.object({
  from: z.string(),
  exchange: z.string().optional(),
  to: z.string(),
  currencyFrom: CurrencyCoreSchema,
  currencyTo: CurrencyCoreSchema,
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
});

export type RouterDto = z.infer<typeof RouterDtoSchema>;

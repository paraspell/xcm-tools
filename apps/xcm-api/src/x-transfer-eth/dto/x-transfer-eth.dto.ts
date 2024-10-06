import { type TCurrencyCore } from '@paraspell/sdk';
import { CurrencyCoreSchema } from '../../x-transfer/dto/XTransferDto.js';
import { z } from 'zod';
import { validateAmount } from '../../utils/validateAmount.js';

export const XTransferEthDtoSchema = z.object({
  to: z.string(),
  amount: z.union([
    z.string().refine(validateAmount, {
      message: 'Amount must be a positive number',
    }),
    z.number().positive({ message: 'Amount must be a positive number' }),
  ]),
  address: z.string().min(1, { message: 'Source address is required' }),
  destAddress: z
    .string()
    .min(1, { message: 'Destination address is required' }),
  currency: CurrencyCoreSchema,
});

export type XTransferEthDto = z.infer<typeof XTransferEthDtoSchema>;

export type PatchedXTransferEthDto = XTransferEthDto & {
  currency: TCurrencyCore;
};

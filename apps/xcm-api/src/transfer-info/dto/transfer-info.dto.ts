import { TCurrencyCore } from '@paraspell/sdk';
import { CurrencyCoreSchema } from '../../x-transfer/dto/XTransferDto.js';
import { z } from 'zod';

export const TransferInfoSchema = z.object({
  origin: z.string(),
  destination: z.string(),
  accountOrigin: z.string().min(1, { message: 'Origin address is required' }),
  accountDestination: z
    .string()
    .min(1, { message: 'Destination address is required' }),
  currency: CurrencyCoreSchema,
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
});

export type TransferInfoDto = z.infer<typeof TransferInfoSchema>;

export type PatchedTransferInfoDto = TransferInfoDto & {
  currency: TCurrencyCore;
};

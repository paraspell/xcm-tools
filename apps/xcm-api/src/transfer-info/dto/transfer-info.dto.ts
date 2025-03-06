import { z } from 'zod';

import { CurrencyCoreWithAmountSchema } from '../../x-transfer/dto/XTransferDto.js';

export const TransferInfoSchema = z.object({
  origin: z.string(),
  destination: z.string(),
  accountOrigin: z.string().min(1, { message: 'Origin address is required' }),
  accountDestination: z
    .string()
    .min(1, { message: 'Destination address is required' }),
  currency: CurrencyCoreWithAmountSchema,
});

export type TransferInfoDto = z.infer<typeof TransferInfoSchema>;

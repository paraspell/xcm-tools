import { z } from 'zod';

import { CurrencyCoreSchema } from '../../x-transfer/dto/XTransferDto.js';

export const BalanceDtoSchema = z.object({
  address: z.string().min(1, { message: 'Address is required' }),
  currency: CurrencyCoreSchema.optional(),
});

export type BalanceDto = z.infer<typeof BalanceDtoSchema>;

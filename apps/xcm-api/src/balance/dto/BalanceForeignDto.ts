import { z } from 'zod';
import { CurrencyCoreSchema } from '../../x-transfer/dto/XTransferDto.js';

export const BalanceForeignDtoSchema = z.object({
  address: z.string().min(1, { message: 'Address is required' }),
  currency: CurrencyCoreSchema,
});

export type BalanceForeignDto = z.infer<typeof BalanceForeignDtoSchema>;

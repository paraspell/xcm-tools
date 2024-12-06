import { z } from 'zod';
import { CurrencyCoreSchema } from '../../x-transfer/dto/XTransferDto.js';

export const ExistentialDepositDtoSchema = z.object({
  currency: CurrencyCoreSchema.optional(),
});

export type ExistentialDepositDto = z.infer<typeof ExistentialDepositDtoSchema>;

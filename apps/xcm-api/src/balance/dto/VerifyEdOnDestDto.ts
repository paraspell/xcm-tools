import { z } from 'zod';

import { CurrencyCoreWithAmountSchema } from '../../x-transfer/dto/XTransferDto.js';

export const VerifyEdOnDestDtoSchema = z.object({
  address: z.string().min(1, { message: 'Address is required' }),
  currency: CurrencyCoreWithAmountSchema,
});

export type VerifyEdOnDestDto = z.infer<typeof VerifyEdOnDestDtoSchema>;

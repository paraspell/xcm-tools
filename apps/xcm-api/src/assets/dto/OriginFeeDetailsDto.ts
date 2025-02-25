import { z } from 'zod';
import { CurrencyCoreWithAmountSchema } from '../../x-transfer/dto/XTransferDto.js';

export const OriginFeeDetailsDtoSchema = z.object({
  origin: z.string(),
  destination: z.string(),
  currency: CurrencyCoreWithAmountSchema,
  account: z.string().min(1, { message: 'Address is required' }),
  accountDestination: z
    .string()
    .min(1, { message: 'Destination address is required' }),
});

export type OriginFeeDetailsDto = z.infer<typeof OriginFeeDetailsDtoSchema>;

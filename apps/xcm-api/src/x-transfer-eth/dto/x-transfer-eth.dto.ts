import { CurrencyCoreSchemaV1WithAmount } from '../../x-transfer/dto/XTransferDto.js';
import { z } from 'zod';

export const XTransferEthDtoSchema = z.object({
  from: z.string(),
  to: z.string(),
  address: z.string().min(1, { message: 'Source address is required' }),
  destAddress: z
    .string()
    .min(1, { message: 'Destination address is required' }),
  currency: CurrencyCoreSchemaV1WithAmount,
});

export type XTransferEthDto = z.infer<typeof XTransferEthDtoSchema>;

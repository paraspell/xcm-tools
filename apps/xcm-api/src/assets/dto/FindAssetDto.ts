import { CHAINS } from '@paraspell/sdk';
import { z } from 'zod';

import { CurrencyCoreSchema } from '../../x-transfer/dto/XTransferDto.js';

export const FindAssetDtoSchema = z.object({
  currency: CurrencyCoreSchema,
  destination: z.enum(CHAINS).optional(),
});

export type FindAssetDto = z.infer<typeof FindAssetDtoSchema>;

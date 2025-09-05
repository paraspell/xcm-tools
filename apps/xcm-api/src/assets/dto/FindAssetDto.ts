import { z } from 'zod';

import { CurrencyCoreSchema } from '../../x-transfer/dto/XTransferDto.js';

export const FindAssetDtoSchema = z.object({
  currency: CurrencyCoreSchema,
  destination: z.string().optional(),
});

export type FindAssetDto = z.infer<typeof FindAssetDtoSchema>;

import { z } from 'zod';

import { CurrencyCoreSchema } from '../../x-transfer/dto/XTransferDto.js';

export const AssetLocationDtoSchema = z.object({
  currency: CurrencyCoreSchema,
});

export type AssetLocationDto = z.infer<typeof AssetLocationDtoSchema>;

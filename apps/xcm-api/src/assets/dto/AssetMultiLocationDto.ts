import { z } from 'zod';
import { CurrencyCoreSchema } from '../../x-transfer/dto/XTransferDto.js';

export const AssetMultiLocationDtoSchema = z.object({
  currency: CurrencyCoreSchema,
});

export type AssetMultiLocationDto = z.infer<typeof AssetMultiLocationDtoSchema>;

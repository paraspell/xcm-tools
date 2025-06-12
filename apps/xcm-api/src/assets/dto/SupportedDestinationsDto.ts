import { z } from 'zod';

import { CurrencyCoreSchema } from '../../x-transfer/dto/XTransferDto.js';

export const SupportedDestinationsSchema = z.object({
  currency: CurrencyCoreSchema,
});

export type SupportedDestinationsDto = z.infer<
  typeof SupportedDestinationsSchema
>;

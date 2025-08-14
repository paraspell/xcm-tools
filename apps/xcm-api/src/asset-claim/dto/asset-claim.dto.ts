import { z } from 'zod';

import {
  AssetSchema,
  BuilderOptionsSchema,
  CurrencyCoreWithAmountSchema,
} from '../../x-transfer/dto/XTransferDto.js';

export const AssetClaimSchema = z.object({
  from: z.string().optional(),
  currency: z.union([
    CurrencyCoreWithAmountSchema,
    z.array(AssetSchema),
    z.array(CurrencyCoreWithAmountSchema),
  ]),
  address: z.string().min(1, { message: 'Address is required' }),
  options: BuilderOptionsSchema.optional(),
});

export type AssetClaimDto = z.infer<typeof AssetClaimSchema>;

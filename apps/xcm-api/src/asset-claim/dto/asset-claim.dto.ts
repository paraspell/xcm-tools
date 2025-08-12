import { z } from 'zod';

import {
  AssetSchema,
  BuilderOptionsSchema,
} from '../../x-transfer/dto/XTransferDto.js';

export const AssetClaimSchema = z.object({
  from: z.string().optional(),
  fungible: z.array(AssetSchema),
  address: z.string().min(1, { message: 'Address is required' }),
  options: BuilderOptionsSchema.optional(),
});

export type AssetClaimDto = z.infer<typeof AssetClaimSchema>;

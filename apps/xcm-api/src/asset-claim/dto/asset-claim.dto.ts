import { z } from 'zod';

import { MultiAssetSchema } from '../../x-transfer/dto/XTransferDto.js';

export const AssetClaimSchema = z.object({
  from: z.string().optional(),
  fungible: z.array(MultiAssetSchema),
  address: z.string().min(1, { message: 'Address is required' }),
});

export type AssetClaimDto = z.infer<typeof AssetClaimSchema>;

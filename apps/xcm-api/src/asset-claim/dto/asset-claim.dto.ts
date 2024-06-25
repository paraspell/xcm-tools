import { MultiAssetSchema } from '../../x-transfer/dto/XTransferDto.js';
import { z } from 'zod';

export const AssetClaimSchema = z.object({
  from: z.string().optional(),
  fungible: z.array(MultiAssetSchema),
  address: z.string().min(1, { message: 'Address is required' }),
});

export type AssetClaimDto = z.infer<typeof AssetClaimSchema>;

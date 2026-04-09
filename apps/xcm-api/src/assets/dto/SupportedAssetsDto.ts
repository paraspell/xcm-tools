import { CHAINS } from '@paraspell/sdk';
import { z } from 'zod';

export const SupportedAssetsDtoSchema = z.object({
  origin: z.enum(CHAINS),
  destination: z.enum(CHAINS),
});

export type SupportedAssetsDto = z.infer<typeof SupportedAssetsDtoSchema>;

import { MultiLocationSchema } from '@paraspell/xcm-analyser';
import { z } from 'zod';

export const XcmAnalyserSchema = z.object({
  multilocation: MultiLocationSchema.optional(),
  xcm: z.array(z.any()).optional(),
});

export type XcmAnalyserDto = z.infer<typeof XcmAnalyserSchema>;

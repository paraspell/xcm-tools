import { LocationSchema } from '@paraspell/xcm-analyser';
import { z } from 'zod';

export const XcmAnalyserSchema = z.object({
  location: LocationSchema.optional(),
  xcm: z.array(z.any()).optional(),
});

export type XcmAnalyserDto = z.infer<typeof XcmAnalyserSchema>;

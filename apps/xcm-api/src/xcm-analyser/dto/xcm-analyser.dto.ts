import { z } from 'zod';
import { MultiLocationSchema } from '../../x-transfer/dto/XTransferDto.js';

export const XcmAnalyserSchema = z.object({
  multilocation: MultiLocationSchema.optional(),
  xcm: z.array(z.any()).optional(),
});

export type XcmAnalyserDto = z.infer<typeof XcmAnalyserSchema>;

import { BatchMode } from '@paraspell/sdk';
import { z } from 'zod';

import { XTransferDtoSchema } from './XTransferDto.js';

export const BatchOptionsSchema = z.object({
  mode: z.nativeEnum(BatchMode),
});

export const BatchXTransferDtoSchema = z.object({
  transfers: z.array(XTransferDtoSchema),
  options: BatchOptionsSchema.optional(),
});

export type TBatchOptions = z.infer<typeof BatchOptionsSchema>;
export type BatchXTransferDto = z.infer<typeof BatchXTransferDtoSchema>;

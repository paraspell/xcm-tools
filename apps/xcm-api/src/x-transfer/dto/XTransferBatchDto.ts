import { BatchMode } from '@paraspell/sdk';
import { z } from 'zod';

import { BuilderOptionsSchema, XTransferDtoSchema } from './XTransferDto.js';

export const BatchOptionsSchema = z.object({
  mode: z.nativeEnum(BatchMode).optional(),
});

export const CombinedBatchOptionsSchema =
  BatchOptionsSchema.merge(BuilderOptionsSchema);

const { options, ...XTransferDtoShapeWithoutOptions } =
  XTransferDtoSchema.shape;

export const XTransferDtoWithoutOptionsSchema = z.object(
  XTransferDtoShapeWithoutOptions,
);

export const BatchXTransferDtoSchema = z.object({
  transfers: z.array(XTransferDtoWithoutOptionsSchema),
  options: CombinedBatchOptionsSchema.optional(),
});

export type TBatchOptions = z.infer<typeof BatchOptionsSchema>;
export type BatchXTransferDto = z.infer<typeof BatchXTransferDtoSchema>;

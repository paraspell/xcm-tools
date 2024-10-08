import type { TAddress, TCurrencyInput } from '@paraspell/sdk';
import { BatchMode } from '@paraspell/sdk';
import { z } from 'zod';
import { XTransferDtoSchema } from './XTransferDto.js';

export const BatchModeSchema = z.nativeEnum(BatchMode);

export const BatchOptionsSchema = z.object({
  mode: BatchModeSchema.optional(),
});

export const BatchXTransferDtoSchema = z.object({
  transfers: z.array(XTransferDtoSchema),
  options: BatchOptionsSchema.optional(),
});

export type TBatchOptions = z.infer<typeof BatchOptionsSchema>;
export type BatchXTransferDto = z.infer<typeof BatchXTransferDtoSchema>;

export type PatchedBatchXTransferDto = BatchXTransferDto & {
  transfers: BatchXTransferDto['transfers'] &
    {
      currency: TCurrencyInput;
      address: TAddress;
    }[];
  options?: BatchXTransferDto['options'] & {
    mode: BatchMode;
  };
};

import { z } from 'zod';

export const BalanceNativeDtoSchema = z.object({
  address: z.string(),
  currency: z
    .object({
      symbol: z.string(),
    })
    .optional(),
});

export type BalanceNativeDto = z.infer<typeof BalanceNativeDtoSchema>;

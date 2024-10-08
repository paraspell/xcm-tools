import { z } from 'zod';

export const BalanceNativeDtoSchema = z.object({
  address: z.string(),
});

export type BalanceNativeDto = z.infer<typeof BalanceNativeDtoSchema>;

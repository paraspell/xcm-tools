import { SUBSTRATE_CHAINS } from '@paraspell/sdk';
import { z } from 'zod';

export const ConvertSs58DtoSchema = z.object({
  address: z.string().nonempty(),
  chain: z.enum(SUBSTRATE_CHAINS),
});

export type ConvertSs58Dto = z.infer<typeof ConvertSs58DtoSchema>;

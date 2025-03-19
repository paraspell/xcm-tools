import { z } from 'zod';

import { AmountSchema } from '../../x-transfer/dto/XTransferDto.js';

const IdentitySchema = z.object({
  display: z.string().optional(),
  legal: z.string().optional(),
  web: z.string().optional(),
  matrix: z.string().optional(),
  email: z.string().optional(),
  image: z.string().optional(),
  twitter: z.string().optional(),
  github: z.string().optional(),
  discord: z.string().optional(),
});

export const CreateIdentitySchema = z.object({
  from: z.string(),
  xcmFee: AmountSchema.optional(),
  regIndex: z.string().or(z.number()),
  maxRegistrarFee: z.string().or(z.number()),
  identity: IdentitySchema,
});

export type CreateIdentityDto = z.infer<typeof CreateIdentitySchema>;

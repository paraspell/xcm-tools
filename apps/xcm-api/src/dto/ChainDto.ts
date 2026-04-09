import { CHAINS, SUBSTRATE_CHAINS } from '@paraspell/sdk';
import { z } from 'zod';

export const ChainSchema = z.enum(CHAINS);
export const SubstrateChainSchema = z.enum(SUBSTRATE_CHAINS);

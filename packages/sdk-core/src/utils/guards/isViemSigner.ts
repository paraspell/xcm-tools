import type { WalletClient } from 'viem'

export const isViemSigner = (value: unknown): value is WalletClient =>
  typeof value === 'object' && value !== null && 'sendTransaction' in value && 'account' in value

import type { TSubstrateChain } from '@paraspell/sdk-core'
import { registerEvmExtension } from '@paraspell/sdk-core'

import { executeEvmTransfer } from './executeEvmTransfer'

registerEvmExtension({ executeEvmTransfer })

export { executeEvmTransfer }

export const EVM_ORIGIN_CHAINS = [
  'Moonbeam',
  'Moonriver',
  'Darwinia'
] as const satisfies readonly TSubstrateChain[]

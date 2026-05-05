import type { TSubstrateChain } from '@paraspell/sdk-core'
import { registerEvmExtension } from '@paraspell/sdk-core'

import { buildEvmTransfer } from './buildEvmTransfer'
import { executeEvmTransfer } from './executeEvmTransfer'

registerEvmExtension({
  executeTransfer: executeEvmTransfer,
  buildTransfer: buildEvmTransfer
})

export { buildEvmTransfer, executeEvmTransfer }

export const EVM_ORIGIN_CHAINS = [
  'Moonbeam',
  'Moonriver',
  'Darwinia'
] as const satisfies readonly TSubstrateChain[]

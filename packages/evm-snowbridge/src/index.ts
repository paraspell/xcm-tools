import { registerEvmSnowbridgeExtension, type TExternalChain } from '@paraspell/sdk-core'

import { buildSnowbridgeTransfer } from './buildSnowbridgeTransfer'
import { executeEvmSnowbridgeTransfer } from './executeEvmSnowbridgeTransfer'

registerEvmSnowbridgeExtension({
  executeTransfer: executeEvmSnowbridgeTransfer,
  buildTransfer: options => buildSnowbridgeTransfer(options).then(({ tx }) => tx)
})

export { approveToken } from './approveToken'
export { buildApproveToken } from './buildApproveToken'
export { executeEvmSnowbridgeTransfer }
export { getTokenBalance } from './getTokenBalance'

export const EVM_ORIGIN_CHAINS = ['Ethereum'] as const satisfies readonly TExternalChain[]

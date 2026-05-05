import { registerEvmSnowbridgeExtension } from '@paraspell/sdk-core'

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

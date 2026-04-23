import { registerEvmSnowbridgeExtension } from '@paraspell/sdk-core'

import { executeEvmSnowbridgeTransfer } from './executeEvmSnowbridgeTransfer'

registerEvmSnowbridgeExtension({ executeEvmSnowbridgeTransfer })

export { approveToken } from './approveToken'
export { executeEvmSnowbridgeTransfer }
export { getTokenBalance } from './getTokenBalance'

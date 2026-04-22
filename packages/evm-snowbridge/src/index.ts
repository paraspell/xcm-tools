import { registerEvmSnowbridgeExtension } from '@paraspell/sdk-core'

import { executeEvmSnowbridgeTransfer } from './executeEvmSnowbridgeTransfer'

registerEvmSnowbridgeExtension({ executeEvmSnowbridgeTransfer })

export { executeEvmSnowbridgeTransfer }

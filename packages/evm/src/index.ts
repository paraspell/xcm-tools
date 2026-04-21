import { registerEvmExtension } from '@paraspell/sdk-core'

import { executeEvmTransfer } from './executeEvmTransfer'

registerEvmExtension({ executeEvmTransfer })

export { executeEvmTransfer }

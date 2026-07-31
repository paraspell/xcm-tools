import type { TBuildEvmTransferOptions } from '@paraspell/sdk-core'
import { UnsupportedOperationError } from '@paraspell/sdk-core'
import type { TransactionSerializableEIP1559 } from 'viem'

import { buildXTokensEvm } from './xTokens/buildXTokensEvm'

export const buildEvmTransfer = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  options: TBuildEvmTransferOptions<TApi, TRes, TSigner, TCustomChain>
): Promise<TransactionSerializableEIP1559> => {
  const { from, to } = options

  if (from === 'Darwinia') {
    return Promise.resolve().then(() => buildXTokensEvm(options))
  }

  return Promise.reject(
    new UnsupportedOperationError(
      `EVM transfer from '${from}' to '${to}' is not supported by @paraspell/evm.`
    )
  )
}

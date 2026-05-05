import type { TBuildEvmTransferOptions } from '@paraspell/sdk-core'
import { UnsupportedOperationError } from '@paraspell/sdk-core'
import type { TransactionSerializableEIP1559 } from 'viem'

import { buildMoonbeamEvm } from './moonbeam/buildMoonbeamEvm'
import { buildMoonbeamToEth } from './moonbeam/buildMoonbeamToEth'

export const buildEvmTransfer = async <TApi, TRes, TSigner>(
  options: TBuildEvmTransferOptions<TApi, TRes, TSigner>
): Promise<TransactionSerializableEIP1559> => {
  const { from, to } = options

  if (from === 'Moonbeam' && to === 'Ethereum') {
    return buildMoonbeamToEth(from, options)
  }

  if (from === 'Moonbeam' || from === 'Moonriver' || from === 'Darwinia') {
    return buildMoonbeamEvm(options)
  }

  throw new UnsupportedOperationError(
    `EVM transfer from '${from}' to '${to}' is not supported by @paraspell/evm.`
  )
}

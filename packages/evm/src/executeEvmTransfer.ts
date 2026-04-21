import {
  type TEvmBuilderOptions,
  UnsupportedOperationError,
  validateAddress
} from '@paraspell/sdk-core'

import { transferMoonbeamEvm } from './moonbeam/transferMoonbeamEvm'
import { transferMoonbeamToEth } from './moonbeam/transferMoonbeamToEth'

export const executeEvmTransfer = async <TApi, TRes, TSigner>(
  options: TEvmBuilderOptions<TApi, TRes, TSigner>
): Promise<string> => {
  const { api, from, to, recipient } = options

  validateAddress(api, recipient, to)

  if (from === 'Moonbeam' && to === 'Ethereum') {
    return transferMoonbeamToEth(from, options)
  }

  if (from === 'Moonbeam' || from === 'Moonriver' || from === 'Darwinia') {
    return transferMoonbeamEvm(options)
  }

  throw new UnsupportedOperationError(
    `EVM transfer from '${from}' to '${to}' is not supported by @paraspell/evm.`
  )
}

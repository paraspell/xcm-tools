import type { TransactionSerializableEIP1559 } from 'viem'

import type { TBuildEvmTransferOptions, TEvmTransferOptions } from '../types'
import { assertExtensionInstalled } from '../utils/assertions'

export interface TEvmExtension {
  executeTransfer: <TApi, TRes, TSigner>(
    options: TEvmTransferOptions<TApi, TRes, TSigner>
  ) => Promise<string>
  buildTransfer: <TApi, TRes, TSigner>(
    options: TBuildEvmTransferOptions<TApi, TRes, TSigner>
  ) => Promise<TransactionSerializableEIP1559>
}

let evmExtension: TEvmExtension | undefined

export const registerEvmExtension = (extension: TEvmExtension | undefined): void => {
  evmExtension = extension
}

export const getEvmExtensionOrThrow = (): TEvmExtension => {
  assertExtensionInstalled(evmExtension, 'EVM', '@paraspell/evm', 'using an EVM origin')
  return evmExtension
}

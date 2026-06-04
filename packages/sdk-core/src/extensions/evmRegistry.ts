import type { TransactionSerializableEIP1559 } from 'viem'

import type { TBuildEvmTransferOptions, TEvmTransferOptions } from '../types'
import { assertExtensionInstalled } from '../utils/assertions'

export interface TEvmExtension {
  executeTransfer: <TApi, TRes, TSigner, TCustomChain extends string = never>(
    options: TEvmTransferOptions<TApi, TRes, TSigner, TCustomChain>
  ) => Promise<string>
  buildTransfer: <TApi, TRes, TSigner, TCustomChain extends string = never>(
    options: TBuildEvmTransferOptions<TApi, TRes, TSigner, TCustomChain>
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

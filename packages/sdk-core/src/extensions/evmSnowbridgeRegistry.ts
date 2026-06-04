import type { TransactionSerializableEIP1559 } from 'viem'

import type { TBuildEvmTransferOptions, TEvmTransferOptions } from '../types'
import { assertExtensionInstalled } from '../utils/assertions'

export interface TEvmSnowbridgeExtension {
  executeTransfer: <TApi, TRes, TSigner, TCustomChain extends string = never>(
    options: TEvmTransferOptions<TApi, TRes, TSigner, TCustomChain>
  ) => Promise<string>
  buildTransfer: <TApi, TRes, TSigner, TCustomChain extends string = never>(
    options: TBuildEvmTransferOptions<TApi, TRes, TSigner, TCustomChain>
  ) => Promise<TransactionSerializableEIP1559>
}

let evmSnowbridgeExtension: TEvmSnowbridgeExtension | undefined

export const registerEvmSnowbridgeExtension = (
  extension: TEvmSnowbridgeExtension | undefined
): void => {
  evmSnowbridgeExtension = extension
}

export const getEvmSnowbridgeExtensionOrThrow = (): TEvmSnowbridgeExtension => {
  assertExtensionInstalled(
    evmSnowbridgeExtension,
    'EVM Snowbridge',
    '@paraspell/evm-snowbridge',
    'using Ethereum as an origin'
  )
  return evmSnowbridgeExtension
}

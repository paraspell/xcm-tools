import type { TEvmTransferOptions } from '../types'
import { assertExtensionInstalled } from '../utils/assertions'

export interface TEvmSnowbridgeExtension {
  executeEvmSnowbridgeTransfer: <TApi, TRes, TSigner>(
    options: TEvmTransferOptions<TApi, TRes, TSigner>
  ) => Promise<string>
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

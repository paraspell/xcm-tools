import type { TEvmTransferOptions } from '../types'
import { assertExtensionInstalled } from '../utils/assertions'

export interface TEvmExtension {
  executeEvmTransfer: <TApi, TRes, TSigner>(
    options: TEvmTransferOptions<TApi, TRes, TSigner>
  ) => Promise<string>
}

let evmExtension: TEvmExtension | undefined

export const registerEvmExtension = (extension: TEvmExtension | undefined): void => {
  evmExtension = extension
}

export const getEvmExtensionOrThrow = (): TEvmExtension => {
  assertExtensionInstalled(evmExtension, 'EVM', '@paraspell/evm', 'using an EVM origin')
  return evmExtension
}

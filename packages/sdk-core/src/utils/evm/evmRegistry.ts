import { ExtensionNotInstalledError } from '../../errors'
import type { TEvmBuilderOptions } from '../../types'

export interface TEvmExtension {
  executeEvmTransfer: <TApi, TRes, TSigner>(
    options: TEvmBuilderOptions<TApi, TRes, TSigner>
  ) => Promise<string>
}

let evmExtension: TEvmExtension | undefined

export const registerEvmExtension = (extension: TEvmExtension): void => {
  evmExtension = extension
}

export const getEvmExtensionOrThrow = (): TEvmExtension => {
  if (!evmExtension) {
    throw new ExtensionNotInstalledError(
      'The EVM extension is not registered. Please install @paraspell/evm and import it before using Ethereum as an origin.'
    )
  }
  return evmExtension
}

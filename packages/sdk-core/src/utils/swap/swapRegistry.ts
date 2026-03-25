import type { RouterBuilder } from '@paraspell/swap'

import { ExtensionNotInstalledError } from '../../errors'

export interface TSwapExtension {
  RouterBuilder: typeof RouterBuilder
}

let swapExtension: TSwapExtension | undefined

export const registerSwapExtension = (extension: TSwapExtension): void => {
  swapExtension = extension
}

export const getSwapExtensionOrThrow = (): TSwapExtension => {
  if (!swapExtension) {
    throw new ExtensionNotInstalledError(
      'The swap extension is not registered. Please install @paraspell/swap and import it before using swap features.'
    )
  }
  return swapExtension
}

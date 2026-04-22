import type { RouterBuilder } from '@paraspell/swap'

import { assertExtensionInstalled } from '../utils/assertions'

export interface TSwapExtension {
  RouterBuilder: typeof RouterBuilder
}

let swapExtension: TSwapExtension | undefined

export const registerSwapExtension = (extension: TSwapExtension | undefined): void => {
  swapExtension = extension
}

export const getSwapExtensionOrThrow = (): TSwapExtension => {
  assertExtensionInstalled(swapExtension, 'swap', '@paraspell/swap', 'using swap features')
  return swapExtension
}

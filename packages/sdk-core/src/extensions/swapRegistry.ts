import type { TSwapBuilderFactory } from '../types'
import { assertExtensionInstalled } from '../utils/assertions'

export interface TSwapExtension {
  SwapBuilder: TSwapBuilderFactory
}

let swapExtension: TSwapExtension | undefined

export const registerSwapExtension = (extension: TSwapExtension | undefined): void => {
  swapExtension = extension
}

export const getSwapExtensionOrThrow = (): TSwapExtension => {
  assertExtensionInstalled(swapExtension, 'swap', '@paraspell/swap', 'using swap features')
  return swapExtension
}

import type { TChain } from '@paraspell/sdk-common'
import { CHAINS } from '@paraspell/sdk-common'

import { DuplicateAssetError, InvalidCurrencyError } from '../errors'
import type { TCurrencyCore } from '../types'
import { findAssetInfoOnDest, findAssetInfoOrThrow } from './search'

export const getSupportedDestinations = (origin: TChain, currency: TCurrencyCore): TChain[] => {
  findAssetInfoOrThrow(origin, currency, null)

  return CHAINS.filter(destination => {
    if (destination === origin) return false

    // Check if we still can find asset if we specify destination
    let originAsset
    try {
      originAsset = findAssetInfoOrThrow(origin, currency, destination)
    } catch (error) {
      if (error instanceof InvalidCurrencyError) {
        return false
      }
      throw error
    }

    try {
      return !!findAssetInfoOnDest(origin, destination, currency, originAsset)
    } catch (error) {
      if (error instanceof DuplicateAssetError) {
        return true
      }
      throw error
    }
  })
}

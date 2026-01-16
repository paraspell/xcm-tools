import { isExternalChain, type TChain } from '@paraspell/sdk-common'

import type { TCurrencyInput } from '../../types'
import { getNativeAssetSymbol } from '../assets'
import { Native } from '../assetSelectors'
import { findAssetInfo } from './findAssetInfo'
import { findAssetInfoOrThrow } from './findAssetInfoOrThrow'

const createSelection = (chain: TChain): TCurrencyInput => {
  const nativeSymbol = getNativeAssetSymbol(chain)
  return {
    symbol: isExternalChain(chain) ? nativeSymbol : Native(nativeSymbol)
  }
}

export const findNativeAssetInfo = (chain: TChain) =>
  findAssetInfo(chain, createSelection(chain), null)

export const findNativeAssetInfoOrThrow = (chain: TChain) =>
  findAssetInfoOrThrow(chain, createSelection(chain), null)

import { isExternalChain, type TChain } from '@paraspell/sdk-common'

import type { TCurrencyInput, TCustomCtx } from '../../types'
import { getNativeAssetSymbol } from '../assets'
import { Native } from '../assetSelectors'
import { findAssetInfoImpl } from './findAssetInfo'
import { findAssetInfoOrThrowImpl } from './findAssetInfoOrThrow'

const createSelection = (chain: TChain): TCurrencyInput => {
  const nativeSymbol = getNativeAssetSymbol(chain)
  return {
    symbol: isExternalChain(chain) ? nativeSymbol : Native(nativeSymbol)
  }
}

export const findNativeAssetInfoImpl = (chain: TChain, ctx?: TCustomCtx) =>
  findAssetInfoImpl(chain, createSelection(chain), null, ctx)

export const findNativeAssetInfo = (chain: TChain) => findNativeAssetInfoImpl(chain)

export const findNativeAssetInfoOrThrowImpl = (chain: TChain, ctx?: TCustomCtx) =>
  findAssetInfoOrThrowImpl(chain, createSelection(chain), null, ctx)

export const findNativeAssetInfoOrThrow = (chain: TChain) => findNativeAssetInfoOrThrowImpl(chain)

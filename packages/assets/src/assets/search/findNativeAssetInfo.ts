import { isExternalChain, type TChain } from '@paraspell/sdk-common'

import type { TCurrencyInput, TCustomCtx } from '../../types'
import { getNativeAssetSymbolImpl } from '../assets'
import { Native } from '../assetSelectors'
import { findAssetInfoImpl } from './findAssetInfo'
import { findAssetInfoOrThrowImpl } from './findAssetInfoOrThrow'

const createSelection = <TCustomChain extends string = never>(
  chain: TChain | TCustomChain,
  ctx?: TCustomCtx
): TCurrencyInput => {
  const nativeSymbol = getNativeAssetSymbolImpl(chain, ctx)
  return {
    symbol: isExternalChain(chain) ? nativeSymbol : Native(nativeSymbol)
  }
}

export const findNativeAssetInfoImpl = <TCustomChain extends string = never>(
  chain: TChain | TCustomChain,
  ctx?: TCustomCtx
) => findAssetInfoImpl(chain, createSelection(chain, ctx), null, ctx)

export const findNativeAssetInfo = (chain: TChain) => findNativeAssetInfoImpl(chain)

export const findNativeAssetInfoOrThrowImpl = <TCustomChain extends string = never>(
  chain: TChain | TCustomChain,
  ctx?: TCustomCtx
) => findAssetInfoOrThrowImpl(chain, createSelection(chain, ctx), null, ctx)

export const findNativeAssetInfoOrThrow = (chain: TChain) => findNativeAssetInfoOrThrowImpl(chain)

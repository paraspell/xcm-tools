import type { TChain } from '@paraspell/sdk-common'

import type { TAssetInfo, TCurrencyCore, TCustomCtx } from '../types'
import { getNativeAssetSymbolImpl } from './assets'
import { Native } from './assetSelectors'
import { findAssetInfoImpl, findAssetInfoOrThrowImpl } from './search'

export const getExistentialDepositImpl = <TCustomChain extends string = never>(
  chain: TChain | TCustomChain,
  currency?: TCurrencyCore,
  ctx?: TCustomCtx
): bigint => {
  let asset: TAssetInfo

  if (!currency) {
    const nativeAssetSymbol = getNativeAssetSymbolImpl(chain, ctx)
    asset =
      findAssetInfoImpl(chain, { symbol: Native(nativeAssetSymbol) }, undefined, ctx) ??
      findAssetInfoOrThrowImpl(chain, { symbol: nativeAssetSymbol }, undefined, ctx)
  } else {
    asset = findAssetInfoOrThrowImpl(chain, currency, undefined, ctx)
  }

  return BigInt(asset.existentialDeposit)
}

/**
 * Retrieves the existential deposit value for a given chain.
 *
 * @param chain - The chain for which to get the existential deposit.
 * @returns The existential deposit as a bigint.
 */
export const getExistentialDeposit = (chain: TChain, currency?: TCurrencyCore): bigint =>
  getExistentialDepositImpl(chain, currency)

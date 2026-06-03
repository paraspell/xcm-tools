import { replaceBigInt, type TChain } from '@paraspell/sdk-common'

import { InvalidCurrencyError } from '../errors'
import type { TAssetInfo, TCurrencyCore, TCustomCtx } from '../types'
import { getNativeAssetSymbolImpl } from './assets'
import { Native } from './assetSelectors'
import { findAssetInfoImpl, findAssetInfoOrThrowImpl } from './search'

const extractEdFromAsset = (asset: TAssetInfo): bigint | null =>
  asset.existentialDeposit ? BigInt(asset.existentialDeposit) : null

export const getExistentialDepositImpl = <TCustomChain extends string = never>(
  chain: TChain | TCustomChain,
  currency?: TCurrencyCore,
  ctx?: TCustomCtx
): bigint | null => {
  let asset: TAssetInfo | null

  if (!currency) {
    const nativeAssetSymbol = getNativeAssetSymbolImpl(chain, ctx)
    asset =
      findAssetInfoImpl(chain, { symbol: Native(nativeAssetSymbol) }, undefined, ctx) ??
      findAssetInfoOrThrowImpl(chain, { symbol: nativeAssetSymbol }, undefined, ctx)
  } else {
    asset = findAssetInfoOrThrowImpl(chain, currency, undefined, ctx)
  }

  return extractEdFromAsset(asset)
}

/**
 * Retrieves the existential deposit value for a given chain.
 *
 * @param chain - The chain for which to get the existential deposit.
 * @returns The existential deposit as a bigint if available; otherwise, null.
 */
export const getExistentialDeposit = (chain: TChain, currency?: TCurrencyCore): bigint | null =>
  getExistentialDepositImpl(chain, currency)

export const assertEdDefined: <TCustomChain extends string = never>(
  ed: bigint | null,
  chain?: TChain | TCustomChain,
  currency?: TCurrencyCore
) => asserts ed is bigint = (ed, chain, currency) => {
  if (ed === undefined || ed === null) {
    throw new InvalidCurrencyError(
      `Existential deposit not found for currency ${JSON.stringify(currency, replaceBigInt)}${chain ? ` on chain ${chain}.` : '.'}`
    )
  }
}

export const getExistentialDepositOrThrowImpl = <TCustomChain extends string = never>(
  chain: TChain | TCustomChain,
  currency?: TCurrencyCore,
  ctx?: TCustomCtx
): bigint => {
  const ed = getExistentialDepositImpl(chain, currency, ctx)
  assertEdDefined(ed, chain, currency)
  return ed
}

export const getExistentialDepositOrThrow = (chain: TChain, currency?: TCurrencyCore): bigint =>
  getExistentialDepositOrThrowImpl(chain, currency)

export const getEdFromAssetOrThrow = (asset: TAssetInfo): bigint => {
  const ed = extractEdFromAsset(asset)
  assertEdDefined(ed, undefined, asset)
  return ed
}

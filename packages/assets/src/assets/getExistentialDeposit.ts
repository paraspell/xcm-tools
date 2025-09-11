import { replaceBigInt, type TChain } from '@paraspell/sdk-common'

import { InvalidCurrencyError } from '../errors'
import type { TAssetInfo, TCurrencyCore } from '../types'
import { getNativeAssetSymbol } from './assets'
import { Native } from './assetSelectors'
import { findAssetInfo, findAssetInfoOrThrow } from './search'

const extractEdFromAsset = (asset: TAssetInfo): bigint | null =>
  asset.existentialDeposit ? BigInt(asset.existentialDeposit) : null

/**
 * Retrieves the existential deposit value for a given chain.
 *
 * @param chain - The chain for which to get the existential deposit.
 * @returns The existential deposit as a bigint if available; otherwise, null.
 */
export const getExistentialDeposit = (chain: TChain, currency?: TCurrencyCore): bigint | null => {
  let asset: TAssetInfo | null

  if (!currency) {
    const nativeAssetSymbol = getNativeAssetSymbol(chain)
    asset =
      findAssetInfo(chain, { symbol: Native(nativeAssetSymbol) }, null) ??
      findAssetInfoOrThrow(chain, { symbol: nativeAssetSymbol }, null)
  } else {
    asset = findAssetInfoOrThrow(chain, currency, null)
  }

  return extractEdFromAsset(asset)
}

export const assertEdDefined: (
  ed: bigint | null,
  chain?: TChain,
  currency?: TCurrencyCore
) => asserts ed is bigint = (ed, chain, currency) => {
  if (ed === undefined || ed === null) {
    throw new InvalidCurrencyError(
      `Existential deposit not found for currency ${JSON.stringify(currency, replaceBigInt)}${chain ? ` on chain ${chain}.` : '.'}`
    )
  }
}

export const getExistentialDepositOrThrow = (chain: TChain, currency?: TCurrencyCore): bigint => {
  const ed = getExistentialDeposit(chain, currency)
  assertEdDefined(ed, chain, currency)
  return ed
}

export const getEdFromAssetOrThrow = (asset: TAssetInfo): bigint => {
  const ed = extractEdFromAsset(asset)
  assertEdDefined(ed, undefined, asset)
  return ed
}

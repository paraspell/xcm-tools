import { replaceBigInt, type TChain } from '@paraspell/sdk-common'

import { InvalidCurrencyError } from '../../errors'
import type { TAssetInfo, TCurrencyInput, TCustomCtx } from '../../types'
import { findAssetInfoImpl } from './findAssetInfo'

export const findAssetInfoOrThrowImpl = (
  chain: TChain,
  currency: TCurrencyInput,
  destination?: TChain | null,
  ctx?: TCustomCtx
): TAssetInfo => {
  const asset = findAssetInfoImpl(chain, currency, destination, ctx)

  if (!asset) {
    throw new InvalidCurrencyError(
      `Asset ${JSON.stringify(currency, replaceBigInt)} not found on ${chain}`
    )
  }

  return asset
}

export const findAssetInfoOrThrow = (
  chain: TChain,
  currency: TCurrencyInput,
  destination?: TChain | null
): TAssetInfo => findAssetInfoOrThrowImpl(chain, currency, destination)

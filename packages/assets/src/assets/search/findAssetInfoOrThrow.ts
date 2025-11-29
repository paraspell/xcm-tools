import { replaceBigInt, type TChain } from '@paraspell/sdk-common'

import { InvalidCurrencyError } from '../../errors'
import type { TAssetInfo, TCurrencyInput } from '../../types'
import { findAssetInfo } from './findAssetInfo'

export const findAssetInfoOrThrow = (
  chain: TChain,
  currency: TCurrencyInput,
  destination: TChain | null
): TAssetInfo => {
  const asset = findAssetInfo(chain, currency, destination)

  if (!asset) {
    throw new InvalidCurrencyError(
      `Asset ${JSON.stringify(currency, replaceBigInt)} not found on ${chain}`
    )
  }

  return asset
}

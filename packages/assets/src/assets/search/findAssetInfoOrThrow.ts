import { replaceBigInt, type TChainWithRelayChains } from '@paraspell/sdk-common'

import { InvalidCurrencyError } from '../../errors'
import type { TAssetInfo, TCurrencyInput } from '../../types'
import { findAssetInfo } from './findAssetInfo'

export const findAssetInfoOrThrow = (
  chain: TChainWithRelayChains,
  currency: TCurrencyInput,
  destination: TChainWithRelayChains | null
): TAssetInfo => {
  const asset =
    findAssetInfo(chain, currency, destination) ??
    (chain === 'AssetHubPolkadot' ? findAssetInfo('Ethereum', currency, null) : null)

  if (!asset) {
    throw new InvalidCurrencyError(
      `Asset ${JSON.stringify(currency, replaceBigInt)} not found on ${chain}`
    )
  }

  return asset
}

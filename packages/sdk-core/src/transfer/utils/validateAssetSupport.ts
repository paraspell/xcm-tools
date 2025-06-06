import { hasSupportForAsset, InvalidCurrencyError, type TAsset } from '@paraspell/assets'
import { isRelayChain, isTMultiLocation } from '@paraspell/sdk-common'

import { TransferToAhNotSupported } from '../../errors'
import { throwUnsupportedCurrency } from '../../pallets/xcmPallet/utils'
import type { TSendOptions } from '../../types'

export const validateAssetSupport = <TApi, TRes>(
  { from: origin, to: destination, currency }: TSendOptions<TApi, TRes>,
  assetCheckEnabled: boolean,
  isBridge: boolean,
  asset: TAsset | null
) => {
  const isDestAssetHub = destination === 'AssetHubPolkadot' || destination === 'AssetHubKusama'

  const allowedChainsToAh = [
    'AssetHubPolkadot',
    'BifrostPolkadot',
    'BifrostKusama',
    'Hydration',
    'Moonbeam',
    'Ajuna',
    'Polimec'
  ]

  if (
    !isRelayChain(origin) &&
    !isBridge &&
    isDestAssetHub &&
    !allowedChainsToAh.includes(origin) &&
    asset?.symbol === 'DOT'
  ) {
    throw new TransferToAhNotSupported(`Node ${origin} does not support DOT transfer to AssetHub`)
  }

  const isRelayDestination = !isTMultiLocation(destination) && isRelayChain(destination)
  const isMultiLocationDestination = typeof destination === 'object'

  if (
    !isBridge &&
    !isRelayDestination &&
    !isMultiLocationDestination &&
    asset?.symbol !== undefined &&
    assetCheckEnabled &&
    !('id' in currency) &&
    !hasSupportForAsset(destination, asset.symbol)
  ) {
    throw new InvalidCurrencyError(
      `Destination node ${destination} does not support currency ${JSON.stringify(currency)}.`
    )
  }

  if (!isBridge && asset === null && assetCheckEnabled) {
    throwUnsupportedCurrency(currency, origin)
  }
}

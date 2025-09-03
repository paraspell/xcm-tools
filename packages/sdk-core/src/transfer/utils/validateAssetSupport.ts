import { hasSupportForAsset, InvalidCurrencyError, type TAssetInfo } from '@paraspell/assets'
import { isRelayChain, isTLocation, replaceBigInt } from '@paraspell/sdk-common'

import { throwUnsupportedCurrency } from '../../pallets/xcmPallet/utils'
import type { TSendOptions } from '../../types'

export const validateAssetSupport = <TApi, TRes>(
  { from: origin, to: destination, currency }: TSendOptions<TApi, TRes>,
  assetCheckEnabled: boolean,
  isBridge: boolean,
  asset: TAssetInfo | null
) => {
  const isRelayDestination = !isTLocation(destination) && isRelayChain(destination)
  const isLocationDestination = typeof destination === 'object'

  if (
    !isBridge &&
    !isRelayDestination &&
    !isLocationDestination &&
    asset?.symbol !== undefined &&
    assetCheckEnabled &&
    !('id' in currency) &&
    !hasSupportForAsset(destination, asset.symbol)
  ) {
    throw new InvalidCurrencyError(
      `Destination chain ${destination} does not support currency ${JSON.stringify(currency, replaceBigInt)}.`
    )
  }

  if (!isBridge && asset === null && assetCheckEnabled) {
    throwUnsupportedCurrency(currency, origin)
  }
}

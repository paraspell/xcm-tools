import type { TCurrencyInputWithAmount } from '@paraspell/assets'
import {
  findNativeAssetInfoOrThrow,
  hasSupportForAsset,
  InvalidCurrencyError,
  isAssetEqual,
  type TAssetInfo
} from '@paraspell/assets'
import type { TSubstrateChain } from '@paraspell/sdk-common'
import {
  deepEqual,
  getJunctionValue,
  isExternalChain,
  isRelayChain,
  isTLocation,
  Parents,
  replaceBigInt
} from '@paraspell/sdk-common'

import { RELAY_LOCATION } from '../../constants'
import { throwUnsupportedCurrency } from '../../pallets/xcmPallet/utils'
import type { TDestination, TSendOptions } from '../../types'
import { getRelayChainOf } from '../../utils'

const validateBridgeAsset = (
  origin: TSubstrateChain,
  destination: TDestination,
  asset: TAssetInfo | null,
  currency: TCurrencyInputWithAmount,
  isBridge: boolean
) => {
  if (!asset || isTLocation(destination) || isExternalChain(destination) || !isBridge) {
    return
  }

  const nativeAsset = findNativeAssetInfoOrThrow(origin)
  const isNativeAsset = isAssetEqual(asset, nativeAsset)
  const ecosystem = getRelayChainOf(destination).toLowerCase()

  const isBridgedAsset =
    asset.location?.parents === Parents.TWO &&
    deepEqual(getJunctionValue(asset.location, 'GlobalConsensus'), { [ecosystem]: null })

  if (!(isNativeAsset || isBridgedAsset)) {
    throw new InvalidCurrencyError(
      `Substrate bridge does not support currency ${JSON.stringify(currency, replaceBigInt)}.`
    )
  }
}

export const validateEthereumAsset = (
  origin: TSubstrateChain,
  destination: TDestination,
  asset: TAssetInfo | null
) => {
  if (!asset || destination !== 'Ethereum' || origin === 'Mythos') return

  const ADDITIONAL_ALLOWED_LOCATIONS = [
    RELAY_LOCATION,
    {
      parents: 2,
      interior: { X1: [{ GlobalConsensus: { Kusama: null } }] }
    }
  ]

  const isEthCompatibleAsset =
    (asset.location?.parents === Parents.TWO &&
      deepEqual(getJunctionValue(asset.location, 'GlobalConsensus'), {
        Ethereum: {
          chainId: 1
        }
      })) ||
    ADDITIONAL_ALLOWED_LOCATIONS.some(loc => deepEqual(asset.location, loc))

  if (!isEthCompatibleAsset) {
    throw new InvalidCurrencyError(
      `Currency ${JSON.stringify(asset, replaceBigInt)} is not transferable to Ethereum.`
    )
  }
}

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

  if (asset === null && assetCheckEnabled) {
    throwUnsupportedCurrency(currency, origin)
  }

  validateBridgeAsset(origin, destination, asset, currency, isBridge)
  validateEthereumAsset(origin, destination, asset)
}

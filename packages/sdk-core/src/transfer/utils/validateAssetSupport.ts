import type { TCurrencyInputWithAmount } from '@paraspell/assets'
import {
  findAssetInfoOnDest,
  findNativeAssetInfoOrThrow,
  InvalidCurrencyError,
  isAssetEqual,
  isBridgedSystemAsset,
  isStableCoinAsset,
  type TAssetInfo
} from '@paraspell/assets'
import type { TChain, TRelaychain, TSubstrateChain } from '@paraspell/sdk-common'
import {
  deepEqual,
  getJunctionValue,
  isExternalChain,
  isSnowbridge,
  isTLocation,
  Parents,
  replaceBigInt
} from '@paraspell/sdk-common'

import { RELAY_LOCATION } from '../../constants'
import type { TDestination, TSendOptions } from '../../types'
import { getRelayChainOf, throwUnsupportedCurrency } from '../../utils'
import { getEthereumJunction } from '../../utils/location/getEthereumJunction'

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

  const isBridgedStablecoin = isStableCoinAsset(asset)

  if (
    !(
      isNativeAsset ||
      isBridgedSystemAsset(asset, [getRelayChainOf(destination)]) ||
      isBridgedStablecoin
    )
  ) {
    throw new InvalidCurrencyError(
      `Substrate bridge does not support currency ${JSON.stringify(currency, replaceBigInt)}.`
    )
  }
}

export const validateEcosystems = (origin: TSubstrateChain, destination: TDestination) => {
  if (isTLocation(destination)) return

  const relayChain = getRelayChainOf(origin)

  const destinationToRelayChains: Partial<Record<TChain, TRelaychain[]>> = {
    Ethereum: ['Polkadot'],
    EthereumTestnet: ['Westend', 'Paseo']
  }

  const allowedRelayChains = destinationToRelayChains[destination]
  if (!allowedRelayChains) return

  if (!allowedRelayChains.includes(relayChain)) {
    throw new InvalidCurrencyError(
      `Destination ${destination} is only supported from following ecosystems: ${allowedRelayChains.join(', ')}.`
    )
  }
}

export const validateEthereumAsset = (
  origin: TSubstrateChain,
  destination: TDestination,
  asset: TAssetInfo | null
) => {
  if (
    !asset ||
    (!isTLocation(destination) && !isSnowbridge(origin, destination)) ||
    origin === 'Mythos'
  ) {
    return
  }

  validateEcosystems(origin, destination)

  const ADDITIONAL_ALLOWED_LOCATIONS = [
    RELAY_LOCATION,
    {
      parents: 2,
      interior: { X1: [{ GlobalConsensus: { Kusama: null } }] }
    }
  ]

  const isEthCompatibleAsset =
    (asset.location.parents === Parents.TWO &&
      deepEqual(
        getJunctionValue(asset.location, 'GlobalConsensus'),
        getEthereumJunction(origin, false).GlobalConsensus
      )) ||
    ADDITIONAL_ALLOWED_LOCATIONS.some(loc => deepEqual(asset.location, loc))

  if (!isEthCompatibleAsset) {
    throw new InvalidCurrencyError(
      `Currency ${JSON.stringify(asset, replaceBigInt)} is not transferable to Ethereum.`
    )
  }
}

export const validateAssetSupport = <TApi, TRes, TSigner>(
  { from: origin, to: destination, currency }: TSendOptions<TApi, TRes, TSigner>,
  assetCheckEnabled: boolean,
  isBridge: boolean,
  asset: TAssetInfo | null
) => {
  const isLocationDestination = typeof destination === 'object'

  if (asset === null && assetCheckEnabled) {
    throwUnsupportedCurrency(currency, origin)
  }

  if (
    !isLocationDestination &&
    assetCheckEnabled &&
    !findAssetInfoOnDest(origin, destination, currency, asset)
  ) {
    throw new InvalidCurrencyError(
      `Destination chain ${destination} does not support currency ${JSON.stringify(currency, replaceBigInt)}.`
    )
  }

  validateBridgeAsset(origin, destination, asset, currency, isBridge)
  validateEthereumAsset(origin, destination, asset)
}

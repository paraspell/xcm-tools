import { findNativeAssetInfoOrThrow } from '@paraspell/assets'
import {
  deepEqual,
  isSubstrateBridge,
  type TLocation,
  type TSubstrateChain
} from '@paraspell/sdk-common'

import { RELAY_LOCATION } from '../../constants'
import type { TPolkadotXCMTransferOptions, TTypeAndThenCallContext } from '../../types'
import {
  assertHasLocation,
  assertToIsString,
  getAssetReserveChain,
  getRelayChainOf
} from '../../utils'

export const getSubBridgeReserve = (
  chain: TSubstrateChain,
  destination: TSubstrateChain,
  location: TLocation
): TSubstrateChain => {
  if (deepEqual(location, RELAY_LOCATION)) return chain
  return destination
}

const resolveReserveChain = (
  chain: TSubstrateChain,
  destination: TSubstrateChain,
  assetLocation: TLocation,
  isSubBridge: boolean,
  overrideReserve?: TSubstrateChain
): TSubstrateChain => {
  if (isSubBridge) {
    return getSubBridgeReserve(chain, destination, assetLocation)
  }

  if (overrideReserve !== undefined) {
    return overrideReserve
  }

  return getAssetReserveChain(chain, assetLocation)
}

export const createTypeAndThenCallContext = async <TApi, TRes>(
  chain: TSubstrateChain,
  options: TPolkadotXCMTransferOptions<TApi, TRes>,
  overrideReserve?: TSubstrateChain
): Promise<TTypeAndThenCallContext<TApi, TRes>> => {
  const { api, destination, assetInfo } = options

  assertHasLocation(assetInfo)
  assertToIsString(destination)

  const destinationChain = destination as TSubstrateChain
  const isSubBridge = isSubstrateBridge(chain, destinationChain)

  const reserveChain = resolveReserveChain(
    chain,
    destinationChain,
    assetInfo.location,
    isSubBridge,
    overrideReserve
  )

  const RELAY_ASSET_LOCATIONS = [
    RELAY_LOCATION,
    {
      parents: 2,
      interior: { X1: [{ GlobalConsensus: { Kusama: null } }] }
    },
    {
      parents: 2,
      interior: { X1: [{ GlobalConsensus: { Polkadot: null } }] }
    }
  ]

  const systemAsset = findNativeAssetInfoOrThrow(getRelayChainOf(chain))

  const isRelayAsset = RELAY_ASSET_LOCATIONS.some(loc => deepEqual(assetInfo.location, loc))

  const destApi = api.clone()
  await destApi.init(destinationChain)

  const reserveApi =
    reserveChain === chain ? api : reserveChain === destinationChain ? destApi : api.clone()

  await reserveApi.init(reserveChain)

  return {
    origin: {
      api,
      chain
    },
    dest: {
      api: destApi,
      chain: destinationChain
    },
    reserve: {
      api: reserveApi,
      chain: reserveChain
    },
    isSubBridge,
    isRelayAsset,
    assetInfo,
    options,
    systemAsset
  }
}

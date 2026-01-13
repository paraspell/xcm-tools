import { findNativeAssetInfoOrThrow } from '@paraspell/assets'
import {
  deepEqual,
  getJunctionValue,
  isSubstrateBridge,
  type TLocation,
  type TSubstrateChain
} from '@paraspell/sdk-common'

import { RELAY_LOCATION } from '../../constants'
import type {
  TPolkadotXCMTransferOptions,
  TTypeAndThenCallContext,
  TTypeAndThenOverrides
} from '../../types'
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
  const destRelay = getRelayChainOf(destination).toLowerCase()
  const isDestReserve = deepEqual(getJunctionValue(location, 'GlobalConsensus'), {
    [destRelay]: null
  })
  if (isDestReserve) return destination
  return chain
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
  options: TPolkadotXCMTransferOptions<TApi, TRes>,
  overrides: TTypeAndThenOverrides
): Promise<TTypeAndThenCallContext<TApi, TRes>> => {
  const { api, chain, destination, assetInfo } = options

  assertHasLocation(assetInfo)
  assertToIsString(destination)

  const destinationChain = destination as TSubstrateChain
  const isSubBridge = isSubstrateBridge(chain, destinationChain)

  const reserveChain = resolveReserveChain(
    chain,
    destinationChain,
    assetInfo.location,
    isSubBridge,
    overrides.reserveChain
  )

  const NO_FEE_ASSET_LOCS = [
    RELAY_LOCATION,
    {
      parents: 2,
      interior: { X1: [{ GlobalConsensus: { Kusama: null } }] }
    },
    {
      parents: 2,
      interior: { X1: [{ GlobalConsensus: { Polkadot: null } }] }
    },
    {
      parents: 1,
      interior: {
        X1: [
          {
            Parachain: 3369
          }
        ]
      }
    }
  ]

  const systemAsset = findNativeAssetInfoOrThrow(getRelayChainOf(chain))

  const isRelayAsset =
    NO_FEE_ASSET_LOCS.some(loc => deepEqual(assetInfo.location, loc)) ||
    isSubBridge ||
    (overrides.noFeeAsset ?? false)

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

import { findNativeAssetInfoOrThrow } from '@paraspell/assets'
import type { TChain } from '@paraspell/sdk-common'
import {
  deepEqual,
  getJunctionValue,
  isExternalChain,
  isSnowbridge,
  isSubstrateBridge,
  RELAYCHAINS,
  type TLocation,
  type TSubstrateChain
} from '@paraspell/sdk-common'

import { RELAY_LOCATION } from '../../constants'
import type {
  TPolkadotXCMTransferOptions,
  TTypeAndThenCallContext,
  TTypeAndThenOverrides
} from '../../types'
import { assertToIsString, getAssetReserveChain, getRelayChainOf } from '../../utils'
import { getEthereumJunction } from '../../utils/location/getEthereumJunction'

export const getBridgeReserve = (
  chain: TSubstrateChain,
  destination: TChain,
  location: TLocation
): TChain => {
  const expectedConsensus = isExternalChain(destination)
    ? getEthereumJunction(chain, false).GlobalConsensus
    : { [getRelayChainOf(destination).toLowerCase()]: null }

  const isDestReserve = deepEqual(getJunctionValue(location, 'GlobalConsensus'), expectedConsensus)

  return isDestReserve ? destination : chain
}

const resolveReserveChain = (
  chain: TSubstrateChain,
  destination: TChain,
  assetLocation: TLocation,
  isSubBridge: boolean,
  overrideReserve?: TSubstrateChain
): TChain => {
  if (isSubBridge) {
    return getBridgeReserve(chain, destination, assetLocation)
  }

  if (overrideReserve !== undefined) {
    return overrideReserve
  }

  return getAssetReserveChain(chain, assetLocation, true)
}

export const createTypeAndThenCallContext = async <TApi, TRes, TSigner>(
  options: TPolkadotXCMTransferOptions<TApi, TRes, TSigner>,
  overrides: TTypeAndThenOverrides
): Promise<TTypeAndThenCallContext<TApi, TRes, TSigner>> => {
  const { api, chain, destination, assetInfo } = options

  assertToIsString(destination)

  const isSubBridge = isSubstrateBridge(chain, destination)
  const isSb = isSnowbridge(chain, destination)

  const reserveChain = resolveReserveChain(
    chain,
    destination,
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

  const assetGlobalConsensus = getJunctionValue(assetInfo.location, 'GlobalConsensus')
  const originRelayChain = getRelayChainOf(chain)
  const isAssetHubToExternal = chain.startsWith('AssetHub') && isExternalChain(destination)
  const isForeignRelayToExternal =
    isExternalChain(destination) &&
    !chain.startsWith('AssetHub') &&
    assetInfo.location.parents === 2 &&
    RELAYCHAINS.some(
      relay =>
        relay !== originRelayChain &&
        deepEqual(assetGlobalConsensus, { [relay.toLowerCase()]: null })
    )

  const isRelayAsset =
    !isForeignRelayToExternal &&
    (isAssetHubToExternal ||
      NO_FEE_ASSET_LOCS.some(loc => deepEqual(assetInfo.location, loc)) ||
      isSubBridge ||
      (overrides.noFeeAsset ?? false))

  const bridgeHopChain: TSubstrateChain | undefined =
    !chain.startsWith('AssetHub') && assetGlobalConsensus !== undefined
      ? `AssetHub${originRelayChain}`
      : undefined

  const destApi = api.clone()
  await destApi.init(destination)

  const reserveApi =
    reserveChain === chain ? api : reserveChain === destination ? destApi : api.clone()

  await reserveApi.init(reserveChain)

  return {
    origin: {
      api,
      chain
    },
    dest: {
      api: destApi,
      chain: destination
    },
    reserve: {
      api: reserveApi,
      chain: reserveChain
    },
    isSubBridge,
    isSnowbridge: isSb,
    isRelayAsset,
    assetInfo,
    options,
    systemAsset,
    bridgeHopChain
  }
}

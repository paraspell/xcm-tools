import type { TChain } from '@paraspell/sdk-common'
import {
  deepEqual,
  getJunctionValue,
  isExternalChain,
  isRelayChain,
  isSnowbridge,
  isSubstrateBridge,
  RELAYCHAINS,
  type TLocation,
  type TSubstrateChain
} from '@paraspell/sdk-common'

import type { PolkadotApi } from '../../api'
import { RELAY_LOCATION } from '../../constants'
import type {
  TPolkadotXCMTransferOptions,
  TTypeAndThenCallContext,
  TTypeAndThenOverrides
} from '../../types'
import { assertToIsString, getRelayChainOf } from '../../utils'
import { getEthereumJunction } from '../../utils/location/getEthereumJunction'

const PINK_LOCATION: TLocation = {
  parents: 1,
  interior: {
    X3: [{ Parachain: 1000 }, { PalletInstance: 50 }, { GeneralIndex: 23 }]
  }
}

const requiresSystemAssetByLocation = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
  assetLocation: TLocation
) => {
  const wudLocation = api.findAssetInfoOrThrow('Jamton', { symbol: 'WUD' }).location
  return [wudLocation, PINK_LOCATION].some(location => deepEqual(assetLocation, location))
}

export const getBridgeReserve = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
  chain: TSubstrateChain | TCustomChain,
  destination: TChain,
  location: TLocation
): TChain | TCustomChain => {
  const expectedConsensus = isExternalChain(destination)
    ? getEthereumJunction(api, chain, false).GlobalConsensus
    : { [getRelayChainOf(destination).toLowerCase()]: null }

  const isDestReserve = deepEqual(getJunctionValue(location, 'GlobalConsensus'), expectedConsensus)

  return isDestReserve ? destination : chain
}

const resolveReserveChain = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
  chain: TSubstrateChain | TCustomChain,
  destination: TChain,
  assetLocation: TLocation,
  isSubBridge: boolean,
  overrideReserve?: TSubstrateChain
): TChain | TCustomChain => {
  if (isSubBridge) {
    return getBridgeReserve(api, chain, destination, assetLocation)
  }

  if (overrideReserve !== undefined) {
    return overrideReserve
  }

  return api.getAssetReserveChain(chain, assetLocation, isExternalChain(destination))
}

export const createTypeAndThenCallContext = async <
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never
>(
  options: TPolkadotXCMTransferOptions<TApi, TRes, TSigner, TCustomChain>,
  overrides: TTypeAndThenOverrides
): Promise<TTypeAndThenCallContext<TApi, TRes, TSigner, TCustomChain>> => {
  const { api, chain, destination, assetInfo } = options

  assertToIsString(destination)

  const isSubBridge = isSubstrateBridge(chain, destination)
  const isSb = isSnowbridge(chain, destination)

  const reserveChain = resolveReserveChain(
    api,
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

  const systemAsset = api.findNativeAssetInfoOrThrow(api.getRelayChainOf(chain))

  const assetGlobalConsensus = getJunctionValue(assetInfo.location, 'GlobalConsensus')
  const originRelayChain = api.getRelayChainOf(chain)
  const isExternalDestination = isExternalChain(destination)
  const isSnowbridgeAsset = deepEqual(
    assetGlobalConsensus,
    getEthereumJunction(api, chain, false).GlobalConsensus
  )
  const requiresSystemAsset =
    !isExternalDestination &&
    (isSnowbridgeAsset ||
      (!isRelayChain(destination) && requiresSystemAssetByLocation(api, assetInfo.location)))
  const isAssetHubToExternal = chain.startsWith('AssetHub') && isExternalDestination
  const isForeignRelayToExternal =
    isExternalDestination &&
    !chain.startsWith('AssetHub') &&
    assetInfo.location.parents === 2 &&
    RELAYCHAINS.some(
      relay =>
        relay !== originRelayChain &&
        deepEqual(assetGlobalConsensus, { [relay.toLowerCase()]: null })
    )

  const isRelayAsset =
    !requiresSystemAsset &&
    !isForeignRelayToExternal &&
    (isAssetHubToExternal ||
      NO_FEE_ASSET_LOCS.some(loc => deepEqual(assetInfo.location, loc)) ||
      isSubBridge ||
      (overrides.noFeeAsset ?? false))

  const assetHubChain: TSubstrateChain = `AssetHub${originRelayChain}`
  const bridgeHopChain: TSubstrateChain | undefined =
    !chain.startsWith('AssetHub') &&
    destination !== assetHubChain &&
    assetGlobalConsensus !== undefined
      ? assetHubChain
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

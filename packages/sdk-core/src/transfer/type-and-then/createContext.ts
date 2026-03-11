import { findNativeAssetInfoOrThrow } from '@paraspell/assets'
import type { TChain } from '@paraspell/sdk-common'
import {
  deepEqual,
  getJunctionValue,
  isExternalChain,
  isSnowbridge,
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
import { assertToIsString, getAssetReserveChain, getRelayChainOf } from '../../utils'
import { getEthereumJunction } from '../../utils/location/getEthereumJunction'

export const getBridgeReserve = (
  chain: TSubstrateChain,
  destination: TChain,
  location: TLocation
): TChain => {
  const isExternal = isExternalChain(destination)

  const destRelay = isExternal ? destination : getRelayChainOf(destination).toLowerCase()

  const expectedConsensus = isExternal
    ? getEthereumJunction(chain, false).GlobalConsensus
    : { [destRelay]: null }

  const isDestReserve = deepEqual(getJunctionValue(location, 'GlobalConsensus'), expectedConsensus)

  return isDestReserve ? destination : chain
}

const resolveReserveChain = (
  chain: TSubstrateChain,
  destination: TChain,
  assetLocation: TLocation,
  isSubBridge: boolean,
  isSnowbridge: boolean,
  overrideReserve?: TSubstrateChain
): TChain => {
  if (isSubBridge || isSnowbridge) {
    return getBridgeReserve(chain, destination, assetLocation)
  }

  if (overrideReserve !== undefined) {
    return overrideReserve
  }

  return getAssetReserveChain(chain, assetLocation)
}

export const createTypeAndThenCallContext = async <TApi, TRes, TSigner>(
  options: TPolkadotXCMTransferOptions<TApi, TRes, TSigner>,
  overrides: TTypeAndThenOverrides
): Promise<TTypeAndThenCallContext<TApi, TRes, TSigner>> => {
  const { api, chain, destination, assetInfo } = options

  assertToIsString(destination)

  const destinationChain = destination as TSubstrateChain
  const isSubBridge = isSubstrateBridge(chain, destinationChain)
  const isSb = isSnowbridge(chain, destinationChain)

  const reserveChain = resolveReserveChain(
    chain,
    destinationChain,
    assetInfo.location,
    isSubBridge,
    isSb,
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
    isSnowbridge: isSb,
    isRelayAsset,
    assetInfo,
    options,
    systemAsset
  }
}

import {
  isRelayChain,
  type TEcosystemType,
  type TNodeDotKsmWithRelayChains,
  type TNodePolkadotKusama
} from '@paraspell/sdk-common'

import { getTNode } from '../../nodes/getTNode'
import type { TPolkadotXCMTransferOptions, TTypeAndThenCallContext } from '../../types'
import { assertHasLocation, getAssetReserveChain, getRelayChainOf } from '../../utils'

export const createTypeAndThenCallContext = async <TApi, TRes>(
  chain: TNodeDotKsmWithRelayChains,
  options: TPolkadotXCMTransferOptions<TApi, TRes>
): Promise<TTypeAndThenCallContext<TApi, TRes>> => {
  const { api, paraIdTo, asset } = options

  assertHasLocation(asset)

  const destChain = getTNode(
    paraIdTo as number,
    getRelayChainOf(chain).toLowerCase() as TEcosystemType
  ) as TNodePolkadotKusama

  const reserveChain = isRelayChain(destChain)
    ? destChain
    : getAssetReserveChain(chain, chain, asset.multiLocation)

  const destApi = api.clone()
  await destApi.init(destChain)

  const reserveApi = reserveChain !== chain ? api.clone() : destApi
  await reserveApi.init(reserveChain)

  return {
    origin: {
      api,
      chain
    },
    dest: {
      api: destApi,
      chain: destChain
    },
    reserve: {
      api: reserveApi,
      chain: reserveChain
    },
    asset,
    options
  }
}

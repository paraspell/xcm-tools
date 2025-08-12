import {
  isRelayChain,
  TRelaychain,
  type TParachain,
  type TSubstrateChain
} from '@paraspell/sdk-common'

import { getTChain } from '../../chains/getTChain'
import type { TPolkadotXCMTransferOptions, TTypeAndThenCallContext } from '../../types'
import { assertHasLocation, getAssetReserveChain, getRelayChainOf } from '../../utils'

export const createTypeAndThenCallContext = async <TApi, TRes>(
  chain: TSubstrateChain,
  options: TPolkadotXCMTransferOptions<TApi, TRes>
): Promise<TTypeAndThenCallContext<TApi, TRes>> => {
  const { api, paraIdTo, assetInfo } = options

  assertHasLocation(assetInfo)

  const destChain = getTChain(
    paraIdTo as number,
    getRelayChainOf(chain).toLowerCase() as TRelaychain
  ) as TParachain

  const reserveChain = isRelayChain(destChain)
    ? destChain
    : getAssetReserveChain(chain, chain, assetInfo.location)

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
    assetInfo,
    options
  }
}

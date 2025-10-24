import {
  isRelayChain,
  isSubstrateBridge,
  isTLocation,
  type TSubstrateChain
} from '@paraspell/sdk-common'

import { InvalidParameterError } from '../../errors'
import type { TPolkadotXCMTransferOptions, TTypeAndThenCallContext } from '../../types'
import { assertHasLocation, getAssetReserveChain, getRelayChainOf } from '../../utils'

export const createTypeAndThenCallContext = async <TApi, TRes>(
  chain: TSubstrateChain,
  options: TPolkadotXCMTransferOptions<TApi, TRes>,
  overrideReserve?: TSubstrateChain
): Promise<TTypeAndThenCallContext<TApi, TRes>> => {
  const { api, destination, assetInfo } = options

  assertHasLocation(assetInfo)

  if (isTLocation(destination)) {
    throw new InvalidParameterError(
      'Cannot override destination when using type and then transfer.'
    )
  }

  const reserveChain =
    overrideReserve !== undefined
      ? overrideReserve
      : // Paseo and Kusama ecosystem migrated reserves to AssetHub
        getRelayChainOf(chain) === 'Paseo' || getRelayChainOf(chain) === 'Kusama'
        ? getAssetReserveChain(chain, chain, assetInfo.location)
        : isRelayChain(destination)
          ? destination
          : getAssetReserveChain(chain, chain, assetInfo.location)

  const destApi = api.clone()
  await destApi.init(destination)

  const reserveApi =
    reserveChain === chain ? api : reserveChain === destination ? destApi : api.clone()

  await reserveApi.init(reserveChain)

  const isSubBridge = isSubstrateBridge(chain, destination)

  return {
    origin: {
      api,
      chain
    },
    dest: {
      api: destApi,
      chain: destination as TSubstrateChain
    },
    reserve: {
      api: reserveApi,
      chain: reserveChain
    },
    isSubBridge,
    assetInfo,
    options
  }
}

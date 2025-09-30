import { isRelayChain, type TSubstrateChain } from '@paraspell/sdk-common'

import { InvalidParameterError } from '../../errors'
import type { TPolkadotXCMTransferOptions, TTypeAndThenCallContext } from '../../types'
import { assertHasLocation, getAssetReserveChain } from '../../utils'

export const createTypeAndThenCallContext = async <TApi, TRes>(
  chain: TSubstrateChain,
  options: TPolkadotXCMTransferOptions<TApi, TRes>
): Promise<TTypeAndThenCallContext<TApi, TRes>> => {
  const { api, destChain, assetInfo } = options

  assertHasLocation(assetInfo)

  if (!destChain) {
    throw new InvalidParameterError(
      'Cannot override destination when using type and then transfer.'
    )
  }

  const reserveChain = isRelayChain(destChain)
    ? destChain
    : getAssetReserveChain(chain, chain, assetInfo.location)

  const destApi = api.clone()
  await destApi.init(destChain)

  const reserveApi =
    reserveChain === chain ? api : reserveChain === destChain ? destApi : api.clone()

  await reserveApi.init(reserveChain)

  return {
    origin: {
      api,
      chain
    },
    dest: {
      api: destApi,
      chain: destChain as TSubstrateChain
    },
    reserve: {
      api: reserveApi,
      chain: reserveChain
    },
    assetInfo,
    options
  }
}

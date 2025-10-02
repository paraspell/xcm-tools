import type { TSubstrateChain } from '@paraspell/sdk-common'

import { getAssetBalanceInternal } from '../../../pallets/assets/balance'
import { createDestination } from '../../../pallets/xcmPallet/utils'
import type { TPolkadotXCMTransferOptions } from '../../../types'
import { assertAddressIsString } from '../../../utils/assertions'
import { getCurrencySelection } from '../../../utils/asset'
import { getRelayChainOf } from '../../../utils/chain/getRelayChainOf'

/**
 * Choose a reserve (AssetHub or Relay) by checking the beneficiary’s balance on each.
 * We resolve the beneficiary account on every candidate and return the first with
 * balance \>= amount, or undefined if none qualify.
 */
export const selectReserveByBalance = async <TApi, TRes>(
  chain: TSubstrateChain,
  options: TPolkadotXCMTransferOptions<TApi, TRes>
): Promise<TSubstrateChain | undefined> => {
  const { api, assetInfo, destination, version, paraIdTo } = options

  const relay = getRelayChainOf(chain)
  const candidates: TSubstrateChain[] = [`AssetHub${relay}` as unknown as TSubstrateChain, relay]

  for (const reserve of candidates) {
    const reserveApi = api.clone()
    await reserveApi.init(reserve)

    const location = createDestination(version, chain, destination, paraIdTo)

    const resolvedAddress = await reserveApi.convertLocationToAccount(location)

    if (!resolvedAddress) {
      continue
    }

    assertAddressIsString(resolvedAddress)

    const balance = await getAssetBalanceInternal({
      api: reserveApi,
      chain: reserve,
      address: resolvedAddress,
      currency: getCurrencySelection(assetInfo)
    })

    if (balance >= assetInfo.amount) {
      return reserve
    }
  }
  return undefined
}

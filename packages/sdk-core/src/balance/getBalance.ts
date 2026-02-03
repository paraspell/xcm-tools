import { findAssetInfoOrThrow, findNativeAssetInfoOrThrow } from '@paraspell/assets'
import { isExternalChain, isRelayChain } from '@paraspell/sdk-common'

import { getPalletInstance } from '../pallets'
import type { TGetAssetBalanceOptions, TGetBalanceOptions } from '../types'
import { getChain, validateAddress } from '../utils'
import { getEthErc20Balance } from './getEthErc20Balance'

export const getAssetBalanceInternal = async <TApi, TRes, TSigner>({
  api,
  address,
  chain,
  asset
}: TGetAssetBalanceOptions<TApi, TRes, TSigner>): Promise<bigint> => {
  validateAddress(api, address, chain, false)

  await api.init(chain)

  // TODO: Refactor this by creating an Ethereum chain class
  if (isExternalChain(chain)) return getEthErc20Balance(chain, asset, address)

  // TODO: Refactor this by creating a Relaychain class
  if (isRelayChain(chain)) {
    const pallet = getPalletInstance('System')
    return pallet.getBalance(api, address, asset)
  }

  const chainInstance = getChain(chain)
  return chainInstance.getBalance(api, address, asset)
}

export const getBalanceInternal = async <TApi, TRes, TSigner>(
  options: TGetBalanceOptions<TApi, TRes, TSigner>
): Promise<bigint> => {
  const { chain, currency } = options
  const asset = currency
    ? findAssetInfoOrThrow(chain, currency, null)
    : findNativeAssetInfoOrThrow(chain)
  return getAssetBalanceInternal({ ...options, asset })
}

export const getBalance = async <TApi, TRes, TSigner>(
  options: TGetBalanceOptions<TApi, TRes, TSigner>
): Promise<bigint> => {
  const { api } = options
  try {
    return await getBalanceInternal(options)
  } finally {
    await api.disconnect()
  }
}

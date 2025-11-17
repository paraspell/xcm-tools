import { findAssetInfoOrThrow } from '@paraspell/assets'
import { isRelayChain } from '@paraspell/sdk-common'

import { getPalletInstance } from '../pallets'
import type { TGetAssetBalanceOptions, TGetBalanceOptions } from '../types'
import { getChain, validateAddress } from '../utils'
import { getEthErc20Balance } from './getEthErc20Balance'

export const getAssetBalanceInternal = async <TApi, TRes>({
  api,
  address,
  chain,
  asset
}: TGetAssetBalanceOptions<TApi, TRes>): Promise<bigint> => {
  validateAddress(api, address, chain, false)

  await api.init(chain)

  // TODO: Refactor this by creating an Ethereum chain class
  if (chain === 'Ethereum') return getEthErc20Balance(asset, address)

  // TODO: Refactor this by creating a Relaychain class
  if (isRelayChain(chain)) {
    const pallet = getPalletInstance('System')
    return pallet.getBalance(api, address, asset)
  }

  const chainInstance = getChain(chain)
  return chainInstance.getBalance(api, address, asset)
}

export const getBalanceInternal = async <TApi, TRes>(
  options: TGetBalanceOptions<TApi, TRes>
): Promise<bigint> => {
  const { chain, currency } = options
  const asset = findAssetInfoOrThrow(chain, currency, null)
  return getAssetBalanceInternal({ ...options, asset })
}

export const getBalance = async <TApi, TRes>(
  options: TGetBalanceOptions<TApi, TRes>
): Promise<bigint> => {
  const { api } = options
  try {
    return await getBalanceInternal(options)
  } finally {
    await api.disconnect()
  }
}

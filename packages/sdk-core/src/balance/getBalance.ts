import { isExternalChain, isRelayChain } from '@paraspell/sdk-common'

import { getChainImpl } from '../chains/getChainInstance'
import { getPalletInstance } from '../pallets'
import type { TGetAssetBalanceOptions, TGetBalanceOptions } from '../types'
import { validateAddress } from '../utils'
import { getEthErc20Balance } from './getEthErc20Balance'

export const getAssetBalanceInternal = async <
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never
>({
  api,
  address,
  chain,
  asset
}: TGetAssetBalanceOptions<TApi, TRes, TSigner, TCustomChain>): Promise<bigint> => {
  validateAddress(api, address, chain, false)

  await api.init(chain)

  // TODO: Refactor this by creating an Ethereum chain class
  if (isExternalChain(chain)) return getEthErc20Balance(chain, asset, address)

  // TODO: Refactor this by creating a Relaychain class
  if (isRelayChain(chain)) {
    const pallet = getPalletInstance('System')
    return pallet.getBalance(api, address, asset)
  }

  const chainInstance = getChainImpl<TApi, TRes, TSigner, TCustomChain>(chain, api._customCtx)
  return chainInstance.getBalance(api, address, asset)
}

export const getBalanceInternal = async <TApi, TRes, TSigner, TCustomChain extends string = never>(
  options: TGetBalanceOptions<TApi, TRes, TSigner, TCustomChain>
): Promise<bigint> => {
  const { api, chain, currency } = options
  const asset = currency
    ? api.findAssetInfoOrThrow(chain, currency)
    : api.findNativeAssetInfoOrThrow(chain)
  return getAssetBalanceInternal({ ...options, asset })
}

export const getBalance = async <TApi, TRes, TSigner, TCustomChain extends string = never>(
  options: TGetBalanceOptions<TApi, TRes, TSigner, TCustomChain>
): Promise<bigint> => {
  const { api } = options
  try {
    return await getBalanceInternal(options)
  } finally {
    await api.disconnect()
  }
}

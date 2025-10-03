import { findAssetInfoOrThrow } from '@paraspell/assets'
import { getDefaultPallet } from '@paraspell/pallets'

import { InvalidParameterError } from '../../../errors'
import type { TGetBalanceForeignOptions } from '../../../types/TBalance'
import { getBalanceForeignPolkadotXcm } from './getBalanceForeignPolkadotXcm'
import { getBalanceForeignXTokens } from './getBalanceForeignXTokens'
import { getEthErc20Balance } from './getEthErc20Balance'

export const getBalanceForeignInternal = async <TApi, TRes>({
  address,
  chain,
  currency,
  api
}: TGetBalanceForeignOptions<TApi, TRes>): Promise<bigint> => {
  await api.init(chain)

  const asset = findAssetInfoOrThrow(chain, currency, null)

  if (chain === 'Ethereum') {
    return getEthErc20Balance(currency, address)
  }

  const defaultPallet = getDefaultPallet(chain)

  if (defaultPallet === 'XTokens') {
    return getBalanceForeignXTokens(api, chain, address, asset)
  } else if (defaultPallet === 'PolkadotXcm' || defaultPallet === 'XTransfer') {
    return getBalanceForeignPolkadotXcm(api, chain, address, asset)
  }

  throw new InvalidParameterError('Unsupported pallet')
}

export const getBalanceForeign = async <TApi, TRes>(
  options: TGetBalanceForeignOptions<TApi, TRes>
): Promise<bigint> => {
  const { api } = options
  try {
    return await getBalanceForeignInternal(options)
  } finally {
    await api.disconnect()
  }
}

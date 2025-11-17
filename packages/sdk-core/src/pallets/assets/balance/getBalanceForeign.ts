import { findAssetInfoOrThrow } from '@paraspell/assets'
import { getDefaultPallet } from '@paraspell/pallets'

import { InvalidParameterError } from '../../../errors'
import type { TGetBalanceForeignOptions } from '../../../types/TBalance'
import { getBalanceForeignPolkadotXcm } from './getBalanceForeignPolkadotXcm'
import { getBalanceForeignXTokens } from './getBalanceForeignXTokens'

export const getBalanceForeign = async <TApi, TRes>({
  address,
  chain,
  currency,
  api
}: TGetBalanceForeignOptions<TApi, TRes>): Promise<bigint> => {
  const asset = findAssetInfoOrThrow(chain, currency, null)

  const defaultPallet = getDefaultPallet(chain)

  if (defaultPallet === 'XTokens') {
    return getBalanceForeignXTokens(api, chain, address, asset)
  } else if (defaultPallet === 'PolkadotXcm' || defaultPallet === 'XTransfer') {
    return getBalanceForeignPolkadotXcm(api, chain, address, asset)
  }

  throw new InvalidParameterError('Unsupported pallet')
}

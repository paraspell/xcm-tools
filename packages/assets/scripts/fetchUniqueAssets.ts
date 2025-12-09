/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { ApiPromise } from '@polkadot/api'
import type { TAssetInfo } from '../src/types'
import { capitalizeLocation } from './utils'
import { getParaId, TJunctionGeneralIndex, TJunctionParachain, TLocation } from '../../sdk-core/src'
import { findAssetInfo } from '../src'
import { CHAINS } from '@paraspell/sdk-common'

const findSimilarAsset = (location: TLocation) => {
  if (location.interior !== 'Here' && location.interior.X3) {
    const paraId = (location.interior.X3[0] as TJunctionParachain)['Parachain']

    if (paraId === getParaId('AssetHubPolkadot')) {
      const id = (location.interior.X3[2] as TJunctionGeneralIndex)['GeneralIndex']
      const asset = findAssetInfo('AssetHubPolkadot', { id }, null)
      if (asset) return asset
    }
  }

  for (const chain of CHAINS) {
    const asset = findAssetInfo(chain, { location }, null)
    if (asset) return asset
  }
  return null
}

export const fetchUniqueForeignAssets = async (
  api: ApiPromise,
  query: string
): Promise<TAssetInfo[]> => {
  const [module, method] = query.split('.')
  const res = await api.query[module][method].entries()

  return res.map(
    ([
      {
        args: [era]
      },
      value
    ]) => {
      const { concrete } = value.toJSON() as any
      const location = capitalizeLocation(concrete) as TLocation
      const asset = findSimilarAsset(location)
      if (!asset) {
        throw new Error(`Asset not found for location: ${JSON.stringify(location)}`)
      }
      return {
        assetId: era.toHuman() as string,
        symbol: asset.symbol,
        decimals: asset.decimals,
        location,
        existentialDeposit: '0'
      }
    }
  )
}

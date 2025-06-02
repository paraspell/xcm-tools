/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { ApiPromise } from '@polkadot/api'
import type { TForeignAsset } from '../src/types'
import { capitalizeMultiLocation } from './fetchOtherAssetsRegistry'
import {
  getParaId,
  TJunctionGeneralIndex,
  TJunctionParachain,
  TMultiLocation
} from '../../sdk-core/src'
import { findAsset } from '../src'
import { NODES_WITH_RELAY_CHAINS } from '@paraspell/sdk-common'

const findSimilarAsset = (multilocation: TMultiLocation) => {
  if (multilocation.interior !== 'Here' && multilocation.interior.X3) {
    const paraId = (multilocation.interior.X3[0] as TJunctionParachain)['Parachain']

    if (paraId === getParaId('AssetHubPolkadot')) {
      const id = (multilocation.interior.X3[2] as TJunctionGeneralIndex)['GeneralIndex']
      const asset = findAsset('AssetHubPolkadot', { id }, null)
      if (asset) return asset
    }
  }

  for (const node of NODES_WITH_RELAY_CHAINS) {
    const asset = findAsset(node, { multilocation }, null)
    if (asset) return asset
  }
  return null
}

export const fetchUniqueForeignAssets = async (
  api: ApiPromise,
  query: string
): Promise<TForeignAsset[]> => {
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
      const multiLocation = capitalizeMultiLocation(concrete) as TMultiLocation
      const asset = findSimilarAsset(multiLocation)
      if (!asset) {
        throw new Error(`Asset not found for multiLocation: ${JSON.stringify(multiLocation)}`)
      }
      return {
        assetId: era.toHuman() as string,
        symbol: asset.symbol,
        decimals: asset.decimals,
        multiLocation,
        existentialDeposit: '0'
      }
    }
  )
}

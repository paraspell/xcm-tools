/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { ApiPromise } from '@polkadot/api'
import type {
  TForeignAsset,
  TJunctionGeneralIndex,
  TJunctionParachain,
  TMultiLocation
} from '../../src/types'
import { capitalizeMultiLocation } from './fetchOtherAssetsRegistry'
import { getAssetBySymbolOrId } from '../../src/pallets/assets'
import { NODES_WITH_RELAY_CHAINS } from '../../src'
import { getParaId } from '../../src/nodes/config'

const findSimilarAsset = (multilocation: TMultiLocation) => {
  if (multilocation.interior !== 'Here' && multilocation.interior.X3) {
    const paraId = (multilocation.interior.X3[0] as TJunctionParachain)['Parachain']

    if (paraId === getParaId('AssetHubPolkadot')) {
      const id = (multilocation.interior.X3[2] as TJunctionGeneralIndex)['GeneralIndex']
      const asset = getAssetBySymbolOrId('AssetHubPolkadot', { id }, null)
      if (asset) return asset
    }
  }

  for (const node of NODES_WITH_RELAY_CHAINS) {
    const asset = getAssetBySymbolOrId(node, { multilocation }, null)
    if (asset) return asset
  }
  return null
}

export const fetchUniqueForeignAssets = async (
  api: ApiPromise,
  query: string
): Promise<TForeignAsset[]> => {
  const [module, section] = query.split('.')
  const res = await api.query[module][section].entries()

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

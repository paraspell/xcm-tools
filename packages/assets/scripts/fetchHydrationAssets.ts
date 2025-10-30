import type { ApiPromise } from '@polkadot/api'
import type { TForeignAssetInfo } from '../src'
import { capitalizeLocation } from './utils'
import { TSubstrateChain } from '@paraspell/sdk-common'

export const fetchHydrationAssets = async (
  chain: TSubstrateChain,
  api: ApiPromise,
  query: string
): Promise<TForeignAssetInfo[]> => {
  const [module, method] = query.split('.')
  const response = await api.query[module][method].entries()

  const assets = await Promise.all(
    response.map(
      async ([
        {
          args: [era]
        },
        value
      ]) => {
        const { symbol, decimals, existentialDeposit } = value.toHuman() as any
        const assetId = era.toHuman() as string
        const numberAssetId = assetId.replace(/[,]/g, '')

        // Special case: overwrite PAS symbol for HydrationPaseo chain and assetId 5
        const finalSymbol = chain === 'HydrationPaseo' && numberAssetId === '5' ? 'PAS' : symbol

        const location = await api.query.assetRegistry.assetLocations(era)

        return {
          assetId: numberAssetId,
          symbol: finalSymbol ?? '',
          decimals: +decimals,
          existentialDeposit,
          location: location.toJSON() !== null ? capitalizeLocation(location.toJSON()) : undefined
        }
      }
    )
  )

  return assets.filter(asset => asset.decimals && asset.decimals > 0 && asset.assetId !== '0')
}

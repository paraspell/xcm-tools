import type { ApiPromise } from '@polkadot/api'
import type { TForeignAssetInfo } from '../src'
import { capitalizeLocation } from './utils'
import { getJunctionValue, hasJunction, TLocation, TSubstrateChain } from '@paraspell/sdk-common'
import { createChainClient } from '../../sdk-pjs/src'
import { getParaId, getRelayChainOf } from '../../sdk-core/src'

const ALLOWED_AH_ASSET_SYMBOLS = ['BILL']

const resolveAhMetadata = async (
  location: TLocation,
  ahApi: ApiPromise
): Promise<{ symbol: string; decimals: number } | null> => {
  const id = getJunctionValue(location, 'GeneralIndex')
  const ahMetadataRaw = await ahApi.query.assets.metadata(id)
  const ahMetadata = ahMetadataRaw.toHuman() as any

  const symbol = ahMetadata.symbol
  const decimals = +ahMetadata.decimals

  if (!ALLOWED_AH_ASSET_SYMBOLS.includes(symbol)) {
    return null
  }

  return { symbol, decimals }
}

export const fetchHydrationAssets = async (
  chain: TSubstrateChain,
  api: ApiPromise,
  query: string
): Promise<TForeignAssetInfo[]> => {
  const [module, method] = query.split('.')
  const response = await api.query[module][method].entries()

  const ahChain = `AssetHub${getRelayChainOf(chain)}` as TSubstrateChain

  const ahApi = await createChainClient(ahChain)

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

        const locationRaw = await api.query.assetRegistry.assetLocations(era)

        const location =
          locationRaw.toJSON() !== null ? capitalizeLocation(locationRaw.toJSON()) : undefined

        let resultSymbol = finalSymbol ?? ''
        let resultDecimals = +decimals

        const isAhAsset =
          location &&
          hasJunction(location, 'GeneralIndex') &&
          getJunctionValue(location, 'Parachain') === getParaId(ahChain)

        if (isAhAsset) {
          const ahResolved = await resolveAhMetadata(location, ahApi)
          if (ahResolved) {
            resultSymbol = ahResolved.symbol
            resultDecimals = ahResolved.decimals
          }
        }

        return {
          assetId: numberAssetId,
          symbol: resultSymbol,
          decimals: resultDecimals,
          existentialDeposit,
          location
        }
      }
    )
  )

  return assets.filter(asset => asset.decimals && asset.decimals > 0 && asset.assetId !== '0')
}

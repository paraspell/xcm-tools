import type { ApiPromise } from '@polkadot/api'
import { getAllAssetsSymbols, type TAssetInfo } from '../src'
import { getParaId, CHAINS, Parents, TSubstrateChain } from '../../sdk-core/src'
import { capitalizeLocation } from './utils'

export const fetchAssetHubAssets = async (
  chain: TSubstrateChain,
  api: ApiPromise,
  query: string
): Promise<TAssetInfo[]> => {
  const [module, method] = query.split('.')

  const otherChains = CHAINS.filter(chain => !chain.includes('AssetHub'))

  const allSymbols = new Set<string>()
  otherChains.forEach(chain => {
    const symbols = getAllAssetsSymbols(chain)
    symbols.forEach(symbol => {
      allSymbols.add(symbol.toLowerCase())
    })
  })

  const regularAssets = await api.query[module][method].entries()
  const parsedRegularAssets = await Promise.all(
    regularAssets
      .filter(([, value]) => {
        const { symbol } = value.toHuman() as any
        return allSymbols.has(symbol.toLowerCase())
      })
      .map(
        async ([
          {
            args: [era]
          },
          value
        ]) => {
          const { symbol, decimals } = value.toHuman() as any
          const details = await api.query[module].asset(era)
          const detailhuman = details.toHuman() as any

          if (detailhuman.status !== 'Live') return null

          const existentialDeposit = detailhuman.minBalance
          const assetId = (era.toHuman() as string).replace(/[,]/g, '')

          return {
            assetId,
            symbol,
            decimals: +decimals,
            location: {
              parents: 1,
              interior: {
                X3: [
                  { Parachain: getParaId('AssetHubPolkadot') },
                  { PalletInstance: 50 },
                  { GeneralIndex: Number(assetId) }
                ]
              }
            },
            existentialDeposit
          }
        }
      )
  )

  const foreignAssets = await api.query.foreignAssets.metadata.entries()
  const parsedForeignAssets = await Promise.all(
    foreignAssets.map(async ([key, value]) => {
      const era = (key as any).args[0]
      const location = era.toJSON() ?? {}
      const assetDetail = await api.query.foreignAssets.asset(era)
      const { symbol, decimals } = (value as any).toHuman()

      return {
        symbol,
        decimals: +decimals,
        location: capitalizeLocation(location),
        existentialDeposit: (assetDetail.toHuman() as any).minBalance.replace(/,/g, '')
      }
    })
  )

  const isAHPolkadot = chain === 'AssetHubPolkadot'
  const wantedSymbol = isAHPolkadot ? 'KSM' : 'DOT'

  const parsedRegularLiveAssets = parsedRegularAssets.filter(item => item !== null)

  // Remove fake KSM assets on AssetHubPolkadot and fake DOT assets on AssetHubKusama
  const parsedFilteredRegularAssets = parsedRegularLiveAssets.filter(asset => {
    const parents = asset.location.parents
    return !(asset.symbol === wantedSymbol && parents !== Parents.TWO)
  })

  return [...parsedFilteredRegularAssets, ...parsedForeignAssets]
}

import type { ApiPromise } from '@polkadot/api'
import { getAllAssetsSymbols, type TForeignAssetInfo } from '../src'
import { getParaId, CHAINS, TLocation } from '../../sdk-core/src'
import { capitalizeLocation } from './utils'

const buildEthereumLocation = (address: string): TLocation => ({
  parents: 2,
  interior: {
    X2: [
      { GlobalConsensus: { Ethereum: { chainId: 1 } } },
      { AccountKey20: { network: null, key: address } }
    ]
  }
})

const STATIC_FOREIGN_ASSETS = [
  {
    symbol: 'wstETH',
    decimals: 18,
    address: '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0'
  },
  {
    symbol: 'tBTC',
    decimals: 18,
    address: '0x18084fba666a33d37592fa2633fd49a74dd93a88'
  },
  {
    symbol: 'PEPE',
    decimals: 18,
    address: '0x6982508145454ce325ddbe47a25d4ec3d2311933'
  }
]

export const fetchAssetHubAssets = async (
  api: ApiPromise,
  query: string
): Promise<TForeignAssetInfo[]> => {
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
          const assetDetails = await api.query[module].asset(era)
          const existentialDeposit = (assetDetails.toHuman() as any).minBalance
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

  const parsedStaticAssets = await Promise.all(
    STATIC_FOREIGN_ASSETS.map(async asset => {
      const location = buildEthereumLocation(asset.address)
      const assetDetail = await api.query.foreignAssets.asset(location)
      const existentialDeposit = (assetDetail.toHuman() as any).minBalance.replace(/,/g, '')

      return {
        symbol: asset.symbol,
        decimals: asset.decimals,
        location,
        existentialDeposit
      }
    })
  )

  return [...parsedRegularAssets, ...parsedForeignAssets, ...parsedStaticAssets]
}

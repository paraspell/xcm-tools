import type { ApiPromise } from '@polkadot/api'
import { getAllAssetsSymbols, type TForeignAsset } from '../src'
import { getParaId, NODES_WITH_RELAY_CHAINS, TMultiLocation } from '../../sdk-core/src'
import { capitalizeMultiLocation } from './utils'

const buildEthereumMultiLocation = (address: string): TMultiLocation => ({
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
  }
]

export const fetchAssetHubAssets = async (
  api: ApiPromise,
  query: string
): Promise<TForeignAsset[]> => {
  const [module, method] = query.split('.')

  const otherNodes = NODES_WITH_RELAY_CHAINS.filter(node => !node.includes('AssetHub'))

  const allSymbols = new Set<string>()
  otherNodes.forEach(node => {
    const symbols = getAllAssetsSymbols(node)
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
            multiLocation: {
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
      const multiLocation = era.toJSON() ?? {}
      const assetDetail = await api.query.foreignAssets.asset(era)
      const { symbol, decimals } = (value as any).toHuman()

      return {
        symbol,
        decimals: +decimals,
        multiLocation: capitalizeMultiLocation(multiLocation),
        existentialDeposit: (assetDetail.toHuman() as any).minBalance.replace(/,/g, '')
      }
    })
  )

  const parsedStaticAssets = await Promise.all(
    STATIC_FOREIGN_ASSETS.map(async asset => {
      const multiLocation = buildEthereumMultiLocation(asset.address)
      const assetDetail = await api.query.foreignAssets.asset(multiLocation)
      const existentialDeposit = (assetDetail.toHuman() as any).minBalance.replace(/,/g, '')

      return {
        symbol: asset.symbol,
        decimals: asset.decimals,
        multiLocation,
        existentialDeposit
      }
    })
  )

  return [...parsedRegularAssets, ...parsedForeignAssets, ...parsedStaticAssets]
}

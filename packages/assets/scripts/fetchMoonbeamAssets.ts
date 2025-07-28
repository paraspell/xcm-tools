/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { ApiPromise } from '@polkadot/api'
import { type TForeignAsset } from '../src'
import { capitalizeLocation } from './utils'
import { formatAssetIdToERC20 } from '../../sdk-core/src/pallets/assets/balance'
import { createPublicClient, http } from 'viem'
import { moonbeam, moonriver } from 'viem/chains'
import { Parents } from '@paraspell/sdk-common'

const moonbeamWhAssets = [
  { assetId: '0x06e605775296e851FF43b4dAa541Bb0984E9D6fD', symbol: 'DAI', decimals: 18 },
  { assetId: '0x99Fec54a5Ad36D50A4Bba3a41CAB983a5BB86A7d', symbol: 'SOL', decimals: 9 },
  { assetId: '0xda430218862d3db25de9f61458645dde49a9e9c1', symbol: 'sUSDS', decimals: 18 },
  { assetId: '0x931715FEE2d06333043d11F658C8CE934aC61D0c', symbol: 'USDC', decimals: 6 },
  { assetId: '0xc30E9cA94CF52f3Bf5692aaCF81353a27052c46f', symbol: 'USDT', decimals: 6 },
  { assetId: '0xE57eBd2d67B462E9926e04a8e33f01cD0D64346D', symbol: 'WBTC', decimals: 8 },
  { assetId: '0xab3f0245B83feB11d15AAffeFD7AD465a59817eD', symbol: 'WETH', decimals: 18 }
]

const ERC20_ABI = [
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  },

  {
    inputs: [],
    name: 'decimals',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const

export const fetchMoonbeamForeignAssets = async (
  api: ApiPromise,
  query: string,
  chain: 'Moonbeam' | 'Moonriver'
): Promise<TForeignAsset[]> => {
  const whAssets: TForeignAsset[] = moonbeamWhAssets.map(({ assetId, symbol, decimals }) => ({
    symbol,
    decimals,
    existentialDeposit: '1',
    assetId,
    multiLocation: {
      parents: Parents.ONE,
      interior: {
        X3: [
          { Parachain: 2004 },
          { PalletInstance: 110 },
          { AccountKey20: { network: null, key: assetId } }
        ]
      }
    }
  }))

  const [module, method] = query.split('.')

  const evmEntries = await api.query[module][method].entries()

  const client = createPublicClient({
    chain: chain === 'Moonbeam' ? moonbeam : moonriver,
    transport:
      chain === 'Moonbeam'
        ? http('https://rpc.api.moonbeam.network/')
        : http('https://rpc.api.moonriver.moonbeam.network/')
  })

  const evmAssets: TForeignAsset[] = await Promise.all(
    evmEntries.map(
      async ([
        {
          args: [era]
        },
        value
      ]) => {
        const assetId = era.toHuman() as string
        const numberAssetId = assetId.replace(/[,]/g, '')
        const location = capitalizeLocation(value.toJSON() as any)

        const tokenAddress = formatAssetIdToERC20(numberAssetId)

        const symbol = await client.readContract({
          address: tokenAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'symbol'
        })

        const decimals = await client.readContract({
          address: tokenAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'decimals'
        })

        return {
          symbol: symbol as string,
          decimals: decimals as number,
          existentialDeposit: '1',
          assetId: numberAssetId,
          location
        }
      }
    )
  )

  return [
    ...(chain === 'Moonbeam' ? whAssets : []),
    ...evmAssets.filter((a): a is TForeignAsset => a !== null)
  ]
}

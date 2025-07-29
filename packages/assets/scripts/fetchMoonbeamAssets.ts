/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { ApiPromise } from '@polkadot/api'
import { type TForeignAsset } from '../src'
import { capitalizeMultiLocation } from './utils'
import { formatAssetIdToERC20 } from '../../sdk-core/src/pallets/assets/balance'
import { createPublicClient, http } from 'viem'
import { moonbeam, moonriver } from 'viem/chains'

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
  node: 'Moonbeam' | 'Moonriver'
): Promise<TForeignAsset[]> => {
  const [module, method] = query.split('.')

  const evmEntries = await api.query[module][method].entries()

  const client = createPublicClient({
    chain: node === 'Moonbeam' ? moonbeam : moonriver,
    transport: node === 'Moonbeam' ? http() : http('https://moonriver.api.onfinality.io/public')
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
        const multiLocation = capitalizeMultiLocation(value.toJSON() as any)

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
          multiLocation
        }
      }
    )
  )

  return evmAssets.filter((a): a is TForeignAsset => a !== null)
}

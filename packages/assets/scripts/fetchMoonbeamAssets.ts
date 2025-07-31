/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { ApiPromise } from '@polkadot/api'
import { type TForeignAssetInfo } from '../src'
import { capitalizeLocation } from './utils'
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
  chain: 'Moonbeam' | 'Moonriver'
): Promise<TForeignAssetInfo[]> => {
  const [module, method] = query.split('.')

  const evmEntries = await api.query[module][method].entries()

  const client = createPublicClient({
    chain: chain === 'Moonbeam' ? moonbeam : moonriver,
    transport: chain === 'Moonbeam' ? http() : http('https://moonriver.api.onfinality.io/public')
  })

  const evmAssets: TForeignAssetInfo[] = await Promise.all(
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

  return evmAssets.filter((a): a is TForeignAssetInfo => a !== null)
}

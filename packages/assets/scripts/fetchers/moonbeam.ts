/* eslint-disable @typescript-eslint/no-explicit-any */
import { Parents, type TSubstrateChain } from '@paraspell/sdk-common'
import type { PolkadotClient } from 'polkadot-api'
import { type Address, createPublicClient, http } from 'viem'
import { moonbeam, moonriver } from 'viem/chains'

import { formatAssetIdToERC20 } from '../../../sdk-core/src/utils/asset'
import type { TAssetInfoNoLoc } from '../types'
import { normalizeLocation } from '../utils/codecUtils'

const moonbeamWhAssets = [
  { assetId: '0x06e605775296e851ff43b4daa541bb0984e9d6fd', symbol: 'DAI', decimals: 18 },
  { assetId: '0x99fec54a5ad36d50a4bba3a41cab983a5bb86a7d', symbol: 'SOL', decimals: 9 },
  { assetId: '0xda430218862d3db25de9f61458645dde49a9e9c1', symbol: 'sUSDS', decimals: 18 },
  { assetId: '0x931715fee2d06333043d11f658c8ce934ac61d0c', symbol: 'USDC', decimals: 6 },
  { assetId: '0xc30e9ca94cf52f3bf5692aacf81353a27052c46f', symbol: 'USDT', decimals: 6 },
  { assetId: '0xe57ebd2d67b462e9926e04a8e33f01cd0d64346d', symbol: 'WBTC', decimals: 8 },
  { assetId: '0xab3f0245b83feb11d15aaffefd7ad465a59817ed', symbol: 'WETH', decimals: 18 }
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

export const fetchMoonbeamAssets = async (
  client: PolkadotClient,
  chain: TSubstrateChain
): Promise<TAssetInfoNoLoc[]> => {
  const api = client.getUnsafeApi()

  const whAssets: TAssetInfoNoLoc[] = moonbeamWhAssets.map(({ assetId, symbol, decimals }) => ({
    symbol,
    decimals,
    existentialDeposit: '1',
    assetId,
    location: {
      parents: Parents.ONE,
      interior: {
        X3: [{ Parachain: 2004 }, { PalletInstance: 110 }, { AccountKey20: { network: null, key: assetId } }]
      }
    }
  }))

  const evmEntries = await api.query.EvmForeignAssets.AssetsById.getEntries()

  const evmClient = createPublicClient({
    chain: chain === 'Moonbeam' ? moonbeam : moonriver,
    transport: http(
      chain === 'Moonbeam'
        ? 'https://rpc.api.moonbeam.network/'
        : 'https://rpc.api.moonriver.moonbeam.network/'
    )
  })

  const evmAssets: TAssetInfoNoLoc[] = await Promise.all(
    evmEntries.map(async ({ keyArgs: [id], value }: any) => {
      const assetId = String(id)
      const location = normalizeLocation(value?.type === 'Xcm' ? value.value : value)
      const tokenAddress = formatAssetIdToERC20(assetId) as Address

      const [symbol, decimals] = await Promise.all([
        evmClient.readContract({ address: tokenAddress, abi: ERC20_ABI, functionName: 'symbol' }),
        evmClient.readContract({ address: tokenAddress, abi: ERC20_ABI, functionName: 'decimals' })
      ])

      return { symbol, decimals, existentialDeposit: '1', assetId, location }
    })
  )

  return [...(chain === 'Moonbeam' ? whAssets : []), ...evmAssets]
}

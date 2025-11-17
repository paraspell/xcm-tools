import type { TSubstrateChain } from '@paraspell/sdk-common'
import { createPublicClient, http } from 'viem'
import { moonbeam, moonriver } from 'viem/chains'

import { formatAssetIdToERC20 } from '../utils'

const ERC20_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  }
] as const

export const getMoonbeamErc20Balance = async (
  chain: TSubstrateChain,
  assetId: string,
  address: string
): Promise<bigint> => {
  const client = createPublicClient({
    chain: chain === 'Moonbeam' ? moonbeam : moonriver,
    transport: http(
      chain === 'Moonbeam'
        ? 'https://rpc.api.moonbeam.network/'
        : 'https://rpc.api.moonriver.moonbeam.network'
    )
  })

  const tokenAddress = assetId.startsWith('0x') ? assetId : formatAssetIdToERC20(assetId)

  return await client.readContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`]
  })
}

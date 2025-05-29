import { createPublicClient, http } from 'viem'
import { moonbeam, moonriver } from 'viem/chains'

import { formatAssetIdToERC20 } from './formatAssetIdToERC20'

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
  node: 'Moonbeam' | 'Moonriver',
  assetId: string,
  address: string
): Promise<bigint> => {
  const client = createPublicClient({
    chain: node === 'Moonbeam' ? moonbeam : moonriver,
    transport: http()
  })

  const tokenAddress = formatAssetIdToERC20(assetId)

  return await client.readContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`]
  })
}

import type { TCurrencyCore } from '@paraspell/assets'
import { findAssetForNodeOrThrow, isForeignAsset } from '@paraspell/assets'
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

import { InvalidParameterError } from '../../../errors'

const ERC20_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  }
] as const

export const getEthErc20Balance = async (
  currency: TCurrencyCore,
  address: string
): Promise<bigint> => {
  const client = createPublicClient({
    chain: mainnet,
    transport: http('https://ethereum.publicnode.com/')
  })

  const asset = findAssetForNodeOrThrow('Ethereum', currency, null)

  if (!isForeignAsset(asset) || !asset.assetId) {
    throw new InvalidParameterError(`Asset ${JSON.stringify(asset)} is not a foreign asset.`)
  }

  if (asset.symbol === 'ETH') {
    return await client.getBalance({ address: address as `0x${string}` })
  }

  return await client.readContract({
    address: asset.assetId as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`]
  })
}

import { getNativeAssetSymbol, type TAssetInfo } from '@paraspell/assets'
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

import { assertHasId } from '../utils'

const ERC20_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  }
] as const

const ETHEREUM_RPC_URL = 'https://ethereum.publicnode.com/'

export const getEthErc20Balance = async (asset: TAssetInfo, address: string): Promise<bigint> => {
  const client = createPublicClient({
    chain: mainnet,
    transport: http(ETHEREUM_RPC_URL)
  })

  assertHasId(asset)

  if (asset.symbol === getNativeAssetSymbol('Ethereum')) {
    return await client.getBalance({ address: address as `0x${string}` })
  }

  return await client.readContract({
    address: asset.assetId as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`]
  })
}

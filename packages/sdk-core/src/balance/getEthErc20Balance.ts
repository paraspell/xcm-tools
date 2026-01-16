import { getNativeAssetSymbol, type TAssetInfo } from '@paraspell/assets'
import type { TExternalChain } from '@paraspell/sdk-common'
import type { Chain } from 'viem'
import { createPublicClient, http } from 'viem'
import { mainnet, sepolia } from 'viem/chains'

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
const ETHEREUM_TESTNET_RPC_URL = 'https://ethereum-sepolia-rpc.publicnode.com/'

const resolveClientValues = (chain: TExternalChain): [Chain, string] => {
  if (chain === 'Ethereum') return [mainnet, ETHEREUM_RPC_URL]
  return [sepolia, ETHEREUM_TESTNET_RPC_URL]
}

export const getEthErc20Balance = async (
  chain: TExternalChain,
  asset: TAssetInfo,
  address: string
): Promise<bigint> => {
  const [config, url] = resolveClientValues(chain)
  const client = createPublicClient({
    chain: config,
    transport: http(url)
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

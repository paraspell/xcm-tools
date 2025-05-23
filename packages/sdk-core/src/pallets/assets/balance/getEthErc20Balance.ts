import type { TCurrencyCore } from '@paraspell/assets'
import { findAssetForNodeOrThrow, isForeignAsset } from '@paraspell/assets'
import { ethers } from 'ethers'

import { InvalidParameterError } from '../../../errors'

const ETH_RPC = 'https://ethereum.publicnode.com/'
const ETH_ID = 1

const ERC20_ABI = ['function balanceOf(address) view returns (uint256)']

export async function getEthErc20Balance(
  currency: TCurrencyCore,
  address: string
): Promise<bigint> {
  const { rpc, id } = { rpc: ETH_RPC, id: ETH_ID }

  const asset = findAssetForNodeOrThrow('Ethereum', currency, null)

  if (!isForeignAsset(asset) || !asset.assetId) {
    throw new InvalidParameterError(`Asset ${JSON.stringify(asset)} is not a foreign asset.`)
  }

  const provider = new ethers.JsonRpcProvider(rpc, id)

  if (asset.symbol === 'ETH') {
    return await provider.getBalance(address)
  }

  const tokenAddress = asset.assetId
  const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider)
  return (await token.balanceOf(address)) as bigint
}

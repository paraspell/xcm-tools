import { ethers } from 'ethers'

import { formatAssetIdToERC20 } from './formatAssetIdToERC20'

const MOONBEAM_RPC = 'https://rpc.api.moonbeam.network'
const MOONBEAM_ID = 1284

const MOONRIVER_RPC = 'https://rpc.api.moonriver.moonbeam.network'
const MOONRIVER_ID = 1285

const ERC20_ABI = ['function balanceOf(address) view returns (uint256)']

export async function getMoonbeamErc20Balance(
  node: 'Moonbeam' | 'Moonriver',
  assetId: string,
  address: string
): Promise<bigint> {
  const { rpc, id } =
    node === 'Moonbeam'
      ? { rpc: MOONBEAM_RPC, id: MOONBEAM_ID }
      : { rpc: MOONRIVER_RPC, id: MOONRIVER_ID }

  const provider = new ethers.JsonRpcProvider(rpc, id)
  const addr = formatAssetIdToERC20(assetId)
  const token = new ethers.Contract(addr, ERC20_ABI, provider)
  return (await token.balanceOf(address)) as bigint
}

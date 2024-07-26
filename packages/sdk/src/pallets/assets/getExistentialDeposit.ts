import { type TNodeDotKsmWithRelayChains, type TEdJsonMap } from '../../types'
import * as edsMapJson from '../../maps/existential-deposits.json' assert { type: 'json' }
import { getBalanceNative } from './getBalanceNative'
const palletsMap = edsMapJson as TEdJsonMap

export const getExistentialDeposit = (node: TNodeDotKsmWithRelayChains): bigint =>
  BigInt(palletsMap[node] as string)

export const getMinNativeTransferableAmount = (node: TNodeDotKsmWithRelayChains): bigint => {
  const ed = getExistentialDeposit(node)
  const tenPercent = ed / BigInt(10)
  return ed + tenPercent
}

export const getMaxNativeTransferableAmount = async (
  address: string,
  node: TNodeDotKsmWithRelayChains
): Promise<bigint> => {
  const ed = getExistentialDeposit(node)
  const nativeBalance = await getBalanceNative(address, node)
  const maxTransferableAmount = nativeBalance - ed - ed / BigInt(10)
  return maxTransferableAmount > BigInt(0) ? maxTransferableAmount : BigInt(0)
}

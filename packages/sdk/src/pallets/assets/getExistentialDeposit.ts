import { type TEdJsonMap, type TNode, type TNodeWithRelayChains } from '../../types'
import * as edsMapJson from '../../maps/existential-deposits.json' assert { type: 'json' }
import { getBalanceNative } from './getBalanceNative'
import { getNativeAssets } from './assets'
import { isRelayChain } from '../../utils'
const palletsMap = edsMapJson as TEdJsonMap

export interface TTransferableAmountResult {
  amount: bigint
  currency: string
}

export const getExistentialDeposit = (node: TNodeWithRelayChains): bigint =>
  BigInt(palletsMap[node] as string)

export const getMinNativeTransferableAmount = (
  node: TNodeWithRelayChains
): TTransferableAmountResult => {
  const ed = getExistentialDeposit(node)
  const tenPercent = ed / BigInt(10)
  const nativeSymbol = isRelayChain(node)
    ? node === 'Polkadot'
      ? 'DOT'
      : 'KSM'
    : getNativeAssets(node as TNode)[0].symbol
  return { amount: ed + tenPercent, currency: nativeSymbol }
}

export const getMaxNativeTransferableAmount = async (
  address: string,
  node: TNodeWithRelayChains
): Promise<TTransferableAmountResult> => {
  const ed = getExistentialDeposit(node)

  const nativeBalance = await getBalanceNative(address, node)
  const maxTransferableAmount = nativeBalance - ed - ed / BigInt(10)
  const nativeSymbol = isRelayChain(node)
    ? node === 'Polkadot'
      ? 'DOT'
      : 'KSM'
    : getNativeAssets(node as TNode)[0].symbol
  return {
    amount: maxTransferableAmount > BigInt(0) ? maxTransferableAmount : BigInt(0),
    currency: nativeSymbol
  }
}

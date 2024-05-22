import { ApiPromise } from '@polkadot/api'
import { TNode, TNodeWithRelayChains } from '../../types'
import { BN } from '@polkadot/util'
import { createApiInstanceForNode } from '../../utils'

export const getBalanceNative = async (
  address: string,
  node: TNodeWithRelayChains,
  api?: ApiPromise
) => {
  const apiWithFallback = api ?? (await createApiInstanceForNode(node))
  const { data }: any = await apiWithFallback.query.system.account(address)
  const balance: BN = data.free.toBn()
  const balanceBigInt: BigInt = BigInt(balance.toString())
  return balanceBigInt
}

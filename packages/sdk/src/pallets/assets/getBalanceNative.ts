import { type ApiPromise } from '@polkadot/api'
import { type TNodeWithRelayChains } from '../../types'
import { type BN } from '@polkadot/util'
import { createApiInstanceForNode } from '../../utils'

export const getBalanceNative = async (
  address: string,
  node: TNodeWithRelayChains,
  api?: ApiPromise
): Promise<bigint> => {
  const apiWithFallback = api ?? (await createApiInstanceForNode(node))
  const { data }: any = await apiWithFallback.query.system.account(address)
  const balance: BN = data.free.toBn()
  return BigInt(balance.toString())
}

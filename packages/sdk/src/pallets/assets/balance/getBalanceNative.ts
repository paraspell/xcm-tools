import { type ApiPromise } from '@polkadot/api'
import { type TNodeWithRelayChains } from '../../../types'
import { type BN } from '@polkadot/util'
import { createApiInstanceForNode } from '../../../utils'
import type { AccountInfo } from '@polkadot/types/interfaces'
import type { UInt } from '@polkadot/types'

export const getBalanceNative = async (
  address: string,
  node: TNodeWithRelayChains,
  api?: ApiPromise
): Promise<bigint> => {
  const apiWithFallback = api ?? (await createApiInstanceForNode(node))
  const response = (await apiWithFallback.query.system.account(address)) as AccountInfo
  const balance: BN = (response.data.free as UInt).toBn()
  return BigInt(balance.toString())
}

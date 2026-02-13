import type { TChain } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'

import type { IPolkadotApi } from '../../api'
import type { TTransactOptions, TWeight } from '../../types'

const resolveTx = async <TApi, TRes, TSigner>(
  destApi: IPolkadotApi<TApi, TRes, TSigner>,
  { call }: TTransactOptions<TRes>
) => {
  if (typeof call !== 'string') return call
  return destApi.txFromHex(call)
}

const resolveMaxWeight = async <TApi, TRes, TSigner>(
  api: IPolkadotApi<TApi, TRes, TSigner>,
  version: Version,
  destChain: TChain,
  address: string,
  options: TTransactOptions<TRes>
): Promise<TWeight | undefined> => {
  const { maxWeight } = options
  if (maxWeight) return maxWeight

  // For versions prior to V5, estimate weight using paymentInfo
  if (version < Version.V5) {
    const destApi = api.clone()
    await destApi.init(destChain)
    const tx = await resolveTx(destApi, options)
    const { weight } = await destApi.getPaymentInfo(tx, address)
    return weight
  }

  // For V5 and later, maxWeight can be undefined
  return undefined
}

const convertWeight = (weight: TWeight | undefined) => {
  if (weight)
    return {
      ref_time: weight.refTime,
      proof_size: weight.proofSize
    }

  return undefined
}

export const createTransactInstructions = async <TApi, TRes, TSigner>(
  api: IPolkadotApi<TApi, TRes, TSigner>,
  options: TTransactOptions<TRes>,
  version: Version,
  destChain: TChain,
  address: string
) => {
  const { call, originKind } = options
  const weightKey = version < Version.V5 ? 'require_weight_at_most' : 'fallback_max_weight'
  const weight = await resolveMaxWeight(api, version, destChain, address, options)
  return [
    // {
    //   Transact: {
    //     origin_kind: originKind ?? 'SovereignAccount',
    //     [weightKey]: convertWeight(weight),
    //     call
    //   }
    // },
    // {
    //   ExpectTransactStatus: { Success: undefined }
    // }
  ]
}

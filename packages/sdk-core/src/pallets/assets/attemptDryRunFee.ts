import { getOriginXcmFee, padFeeBy } from '../../transfer'
import type { TGetOriginXcmFeeOptions, TXcmFeeDetail } from '../../types'

export const attemptDryRunFee = async <TApi, TRes>(
  options: TGetOriginXcmFeeOptions<TApi, TRes>
): Promise<TXcmFeeDetail> => {
  const { currency } = options
  const reductionPcts = [10, 20, 30, 40, 50]
  const lastReduction = reductionPcts[reductionPcts.length - 1]

  let result: TXcmFeeDetail | null = null

  for (const percentage of reductionPcts) {
    result = await getOriginXcmFee({
      ...options,
      currency: {
        ...currency,
        amount: padFeeBy(BigInt(currency.amount), -percentage)
      }
    })

    if (result.feeType === 'dryRun' || percentage === lastReduction) {
      return result
    }
  }

  return result as TXcmFeeDetail
}

import { getOriginXcmFee, padFeeBy } from '../../transfer'
import type { TAttemptDryRunFeeOptions, TXcmFeeDetail } from '../../types'

export const attemptDryRunFee = async <TApi, TRes>(
  options: TAttemptDryRunFeeOptions<TApi, TRes>
): Promise<TXcmFeeDetail> => {
  const { currency, builder } = options
  const reductionPcts = [0, 10, 20, 30, 40, 50]
  const lastReduction = reductionPcts[reductionPcts.length - 1]

  let result: TXcmFeeDetail | null = null

  for (const percentage of reductionPcts) {
    const modifiedBuilder = builder.currency({
      ...currency,
      amount: padFeeBy(BigInt(currency.amount), -percentage)
    })

    result = await getOriginXcmFee({
      ...options,
      tx: await modifiedBuilder.build()
    })

    if (result.feeType === 'dryRun' || percentage === lastReduction) {
      return result
    }
  }

  return result as TXcmFeeDetail
}

import { AmountTooLowError } from '../../errors'

export const getBypassResultWithRetries = async <
  TApi,
  TRes,
  TResult extends { failureReason?: string } | { dryRunError?: string }
>(
  options: { buildTx: (amount?: string) => Promise<TRes> } & TApi,
  internalFn: (opts: { tx: TRes; useRootOrigin: boolean } & TApi) => Promise<TResult>,
  initialTx?: TRes,
  maxRetries = 5,
  bumpStep = 100
): Promise<TResult> => {
  const hasError = (res: TResult): boolean => {
    return 'failureReason' in res
      ? !!res.failureReason
      : 'dryRunError' in res
        ? !!res.dryRunError
        : false
  }

  if (initialTx) {
    try {
      const first = await internalFn({ ...options, tx: initialTx, useRootOrigin: true })
      if (!hasError(first)) return first
    } catch (e: unknown) {
      if (!(e instanceof AmountTooLowError)) throw e
    }
  }

  let result: TResult | null = null
  for (let i = 1; i <= maxRetries; i++) {
    const amount = (bumpStep * i).toString()
    let bumpedTx: TRes
    try {
      bumpedTx = await options.buildTx(amount)
    } catch (e: unknown) {
      if (e instanceof AmountTooLowError) {
        if (i === maxRetries) throw e
        continue
      }
      throw e
    }

    try {
      result = await internalFn({ ...options, tx: bumpedTx, useRootOrigin: true })
      if (!hasError(result)) return result
    } catch (e: unknown) {
      if (e instanceof AmountTooLowError) {
        if (i === maxRetries) throw e
        continue
      }
      throw e
    }
  }

  return result!
}

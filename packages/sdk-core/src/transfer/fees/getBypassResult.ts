import { AmountTooLowError } from '../../errors'
import type { TTxFactory } from '../../types'

const MAX_INCREASE_RETRIES = 5
const INCREASE_BUMP_STEP = 100

const DECREASE_START_AMOUNT = 1
const MAX_DECREASE_RETRIES = 5
const DECREASE_DIVIDE_FACTOR = 5
const FAILED_TO_TRANSACT_ASSET = 'FailedToTransactAsset'

export const getBypassResultWithRetries = async <
  TApi,
  TRes,
  TResult extends { failureReason?: string } | { dryRunError?: string }
>(
  options: { buildTx: TTxFactory<TRes> } & TApi,
  internalFn: (opts: { tx: TRes; useRootOrigin: boolean } & TApi) => Promise<TResult>,
  initialTx?: TRes,
  maxRetries = MAX_INCREASE_RETRIES,
  bumpStep = INCREASE_BUMP_STEP
): Promise<TResult> => {
  const getResultError = (res: TResult): string | undefined =>
    'failureReason' in res ? res.failureReason : 'dryRunError' in res ? res.dryRunError : undefined

  const isFailedToTransact = (res: TResult): boolean =>
    'failureReason' in res && res.failureReason === FAILED_TO_TRANSACT_ASSET

  const isAmountTooLow = (e: unknown): e is AmountTooLowError => e instanceof AmountTooLowError

  const attempt = async (amount?: string, relative?: boolean): Promise<TResult> => {
    const tx = await options.buildTx(amount, relative)
    return internalFn({ ...options, tx, useRootOrigin: true })
  }

  const retryWithReducedAmount = async (start = DECREASE_START_AMOUNT): Promise<TResult> => {
    const divide = (v: number) => {
      const next = v / DECREASE_DIVIDE_FACTOR
      return next > 0 ? next : 1
    }

    let amount = divide(start)

    for (let attemptIdx = 0; attemptIdx < MAX_DECREASE_RETRIES && amount > 0; attemptIdx++) {
      try {
        const res = await attempt(amount.toString(), false)
        const err = getResultError(res)
        if (!err) return res

        if (isFailedToTransact(res)) {
          amount = divide(amount)
          continue
        }

        return res
      } catch (e) {
        if (isAmountTooLow(e)) {
          amount = divide(amount)
          continue
        }
        throw e
      }
    }

    return attempt(amount.toString(), false)
  }

  if (initialTx) {
    try {
      const first = await internalFn({ ...options, tx: initialTx, useRootOrigin: true })
      if (!getResultError(first)) return first
    } catch (e) {
      if (!isAmountTooLow(e)) throw e
    }
  }

  for (let i = 1; i <= maxRetries; i++) {
    const amount = bumpStep * i

    try {
      const res = await attempt(amount.toString())
      const err = getResultError(res)

      if (!err) return res

      if (isFailedToTransact(res)) {
        return retryWithReducedAmount(DECREASE_START_AMOUNT)
      }

      continue
    } catch (e) {
      if (isAmountTooLow(e)) {
        if (i === maxRetries) throw e
        continue
      }
      throw e
    }
  }

  return attempt(String(bumpStep * maxRetries))
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AmountTooLowError } from '../../errors'
import { getBypassResultWithRetries } from './getBypassResult'

type TApiStub = { someApiProp?: string }
type TResStub = { id: string }

const okFailureReason = () => ({ failureReason: undefined }) as const
const failFailureReason = (msg = 'err') => ({ failureReason: msg }) as const

const okDryRun = () => ({ dryRunError: undefined }) as const
const failDryRun = (msg = 'dry') => ({ dryRunError: msg }) as const

describe('getBypassResultWithRetries', () => {
  let buildTx: ReturnType<typeof vi.fn>
  let internalFn: ReturnType<typeof vi.fn>
  const api: TApiStub = { someApiProp: 'x' }

  beforeEach(() => {
    vi.clearAllMocks()
    buildTx = vi.fn<() => Promise<TResStub>>() as any
    internalFn = vi.fn<(arg: any) => Promise<any>>() as any
  })

  it('returns immediately when initialTx passes (no retries, failureReason shape)', async () => {
    const initialTx: TResStub = { id: 'initial' }
    internalFn.mockResolvedValueOnce(okFailureReason())

    const res = await getBypassResultWithRetries({ ...api, buildTx }, internalFn, initialTx)

    expect(internalFn).toHaveBeenCalledTimes(1)
    expect(internalFn).toHaveBeenCalledWith(
      expect.objectContaining({ tx: initialTx, useRootOrigin: true })
    )
    expect(buildTx).not.toHaveBeenCalled()
    expect(res).toEqual(okFailureReason())
  })

  it('retries with increasing amounts until success (100, 200, ...)', async () => {
    const initialTx: TResStub = { id: 'initial' }
    internalFn
      .mockResolvedValueOnce(failFailureReason('first-fail'))
      .mockResolvedValueOnce(failFailureReason('retry-1-fail'))
      .mockResolvedValueOnce(okFailureReason())

    buildTx.mockResolvedValueOnce({ id: 'tx-100' }).mockResolvedValueOnce({ id: 'tx-200' })

    const res = await getBypassResultWithRetries({ ...api, buildTx }, internalFn, initialTx)

    expect(buildTx).toHaveBeenNthCalledWith(1, '100')
    expect(buildTx).toHaveBeenNthCalledWith(2, '200')
    expect(res).toEqual(okFailureReason())
  })

  it('skips a retry when buildTx throws AmountTooLowError and succeeds later', async () => {
    internalFn.mockResolvedValueOnce({ failureReason: undefined })

    buildTx.mockRejectedValueOnce(new AmountTooLowError()).mockResolvedValueOnce({ id: 'tx-200' })

    const res = await getBypassResultWithRetries({ ...api, buildTx }, internalFn)

    expect(buildTx).toHaveBeenNthCalledWith(1, '100')
    expect(buildTx).toHaveBeenNthCalledWith(2, '200')
    expect(buildTx).not.toHaveBeenCalledWith('300')

    expect(internalFn).toHaveBeenCalledTimes(1)
    expect(internalFn).toHaveBeenCalledWith(
      expect.objectContaining({ tx: { id: 'tx-200' }, useRootOrigin: true })
    )

    expect(res).toEqual({ failureReason: undefined })
  })

  it('rethrows AmountTooLowError from buildTx on the last attempt', async () => {
    buildTx.mockRejectedValue(new AmountTooLowError())

    await expect(
      getBypassResultWithRetries({ ...api, buildTx }, internalFn, undefined, 2)
    ).rejects.toBeInstanceOf(AmountTooLowError)

    expect(buildTx).toHaveBeenCalledTimes(2)
    expect(buildTx).toHaveBeenNthCalledWith(1, '100')
    expect(buildTx).toHaveBeenNthCalledWith(2, '200')
  })

  it('continues when internalFn throws AmountTooLowError and succeeds later', async () => {
    buildTx.mockResolvedValueOnce({ id: 'tx-100' }).mockResolvedValueOnce({ id: 'tx-200' })

    internalFn
      .mockRejectedValueOnce(new AmountTooLowError())
      .mockResolvedValueOnce(okFailureReason())

    const res = await getBypassResultWithRetries({ ...api, buildTx }, internalFn)
    expect(buildTx).toHaveBeenCalledTimes(2)
    expect(res).toEqual(okFailureReason())
  })

  it('rethrows AmountTooLowError from internalFn on the last attempt', async () => {
    buildTx.mockResolvedValueOnce({ id: 'tx-100' }).mockResolvedValueOnce({ id: 'tx-200' })

    internalFn
      .mockRejectedValueOnce(new AmountTooLowError())
      .mockRejectedValueOnce(new AmountTooLowError())

    await expect(
      getBypassResultWithRetries({ ...api, buildTx }, internalFn, undefined, 2)
    ).rejects.toBeInstanceOf(AmountTooLowError)
  })

  it('returns the last failing result if all retries return failure (failureReason shape)', async () => {
    buildTx.mockResolvedValueOnce({ id: 'tx-100' }).mockResolvedValueOnce({ id: 'tx-200' })

    internalFn
      .mockResolvedValueOnce(failFailureReason('fail-100'))
      .mockResolvedValueOnce(failFailureReason('fail-200'))

    const res = await getBypassResultWithRetries({ ...api, buildTx }, internalFn, undefined, 2)
    expect(res).toEqual(failFailureReason('fail-200'))
  })

  it('handles dryRunError shape similarly (no initialTx)', async () => {
    buildTx.mockResolvedValueOnce({ id: 'tx-100' }).mockResolvedValueOnce({ id: 'tx-200' })

    internalFn.mockResolvedValueOnce(failDryRun('dry-100')).mockResolvedValueOnce(okDryRun())

    const res = await getBypassResultWithRetries({ ...api, buildTx }, internalFn)
    expect(res).toEqual(okDryRun())
  })

  it('when initialTx causes AmountTooLowError in internalFn, it proceeds to retries', async () => {
    const initialTx = { id: 'init' }
    internalFn
      .mockRejectedValueOnce(new AmountTooLowError())
      .mockResolvedValueOnce(okFailureReason())

    buildTx.mockResolvedValueOnce({ id: 'tx-100' })

    const res = await getBypassResultWithRetries({ ...api, buildTx }, internalFn, initialTx, 3)
    expect(buildTx).toHaveBeenCalledWith('100')
    expect(res).toEqual(okFailureReason())
  })
})

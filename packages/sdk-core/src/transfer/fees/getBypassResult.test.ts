import { describe, expect, it, vi } from 'vitest'

import { AmountTooLowError } from '../../errors'
import { getBypassResultWithRetries } from './getBypassResult'

describe('getBypassResultWithRetries', () => {
  it('returns immediately when initialTx succeeds', async () => {
    const buildTx = vi.fn((a?: string, r?: boolean) => Promise.resolve({ a, r }))
    const internalFn = vi.fn(() => Promise.resolve({}))
    const res = await getBypassResultWithRetries({ buildTx }, internalFn, {} as unknown)
    expect(res).toEqual({})
    expect(internalFn).toHaveBeenCalledTimes(1)
    expect(buildTx).not.toHaveBeenCalled()
  })

  it('retries with increasing amounts until success', async () => {
    const buildTx = vi.fn((a?: string) => Promise.resolve({ a }))
    const internalFn = vi
      .fn()
      .mockResolvedValueOnce({ dryRunError: 'x' })
      .mockResolvedValueOnce({ dryRunError: 'y' })
      .mockResolvedValueOnce({})
    const res = await getBypassResultWithRetries({ buildTx }, internalFn)
    expect(res).toEqual({})
    expect(buildTx.mock.calls.map(c => c[0])).toEqual(['100', '200', '300'])
  })

  it('on FailedToTransactAsset, runs reduced-amount flow (relative=false)', async () => {
    const buildTx = vi.fn((a?: string, rel?: boolean) => Promise.resolve({ a, rel }))
    let call = 0
    const internalFn = vi.fn(() => {
      call += 1
      if (call === 1) return Promise.resolve({ failureReason: 'FailedToTransactAsset' })
      if (call < 5) return Promise.resolve({ failureReason: 'FailedToTransactAsset' })
      return Promise.resolve({})
    })
    const res = await getBypassResultWithRetries({ buildTx }, internalFn)
    expect(res).toEqual({})
    const reducedCalls = buildTx.mock.calls.slice(1)
    expect(reducedCalls.length).toBeGreaterThan(0)
    expect(reducedCalls.every(c => c[1] === false)).toBe(true)
  })

  it('divides reduced amount when AmountTooLowError occurs during retry', async () => {
    const buildTx = vi.fn((a?: string, rel?: boolean) => Promise.resolve({ a, rel }))
    let call = 0
    const internalFn = vi.fn(() => {
      call += 1
      if (call === 1) return Promise.resolve({ failureReason: 'FailedToTransactAsset' })
      if (call === 2) return Promise.reject(new AmountTooLowError('low'))
      return Promise.resolve({})
    })
    const res = await getBypassResultWithRetries({ buildTx }, internalFn)
    expect(res).toEqual({})
    expect(buildTx).toHaveBeenCalledTimes(3)
    expect(buildTx).toHaveBeenNthCalledWith(1, '100', undefined)
    expect(buildTx).toHaveBeenNthCalledWith(2, '0.2', false)
    expect(buildTx).toHaveBeenNthCalledWith(3, '0.04', false)
  })

  it('after exhausting reduced retries performs final attempt', async () => {
    const buildTx = vi.fn((a?: string, rel?: boolean) => Promise.resolve({ a, rel }))
    const responses = [
      ...Array.from({ length: 6 }, () => ({ failureReason: 'FailedToTransactAsset' as const })),
      {}
    ]
    const internalFn = vi.fn(() => {
      const next = responses.shift()
      if (!next) throw new Error('unexpected call')
      return Promise.resolve(next as Record<string, unknown>)
    })
    const res = await getBypassResultWithRetries({ buildTx }, internalFn)
    expect(res).toEqual({})
    expect(buildTx).toHaveBeenCalledTimes(7)
    const reducedCalls = buildTx.mock.calls.slice(1)
    expect(reducedCalls.every(c => c[1] === false)).toBe(true)
    for (let idx = 1; idx < reducedCalls.length; idx++) {
      const previous = Number(reducedCalls[idx - 1][0])
      const current = Number(reducedCalls[idx][0])
      expect(current).toBeCloseTo(previous / 5, 10)
    }
  })

  it('throws after max retries with AmountTooLowError', async () => {
    const buildTx = vi.fn((a?: string) => Promise.resolve({ a }))
    const internalFn = vi.fn(() => Promise.reject(new AmountTooLowError('low')))
    await expect(
      getBypassResultWithRetries({ buildTx }, internalFn, undefined, 2, 50)
    ).rejects.toBeInstanceOf(AmountTooLowError)
    expect(buildTx.mock.calls.map(c => c[0])).toEqual(['50', '100'])
  })

  it('ignores AmountTooLowError from initialTx and continues', async () => {
    const buildTx = vi.fn((a?: string) => Promise.resolve({ a }))
    const internalFn = vi
      .fn()
      .mockRejectedValueOnce(new AmountTooLowError('low'))
      .mockResolvedValueOnce({})
    const res = await getBypassResultWithRetries({ buildTx }, internalFn, {} as unknown)
    expect(res).toEqual({})
    expect(buildTx).toHaveBeenCalledWith('100', undefined)
  })
})

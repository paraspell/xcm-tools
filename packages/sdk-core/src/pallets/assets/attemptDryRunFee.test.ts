/* eslint-disable @typescript-eslint/unbound-method */
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { GeneralBuilder } from '../../builder'
import { getOriginXcmFeeInternal, padFeeBy } from '../../transfer'
import type { TAttemptDryRunFeeOptions, TSendBaseOptions, TXcmFeeDetail } from '../../types'
import { attemptDryRunFee } from './attemptDryRunFee'

vi.mock('../../transfer')

describe('attemptDryRunFee', () => {
  const mockTx = { encoded: 'mockTx' }

  const mockBuilder = {
    currency: vi.fn(),
    build: vi.fn()
  } as unknown as GeneralBuilder<unknown, unknown, TSendBaseOptions>

  const mockOptions = {
    api: {},
    currency: { amount: 1000n },
    origin: 'Polkadot',
    destination: 'Kusama',
    builder: mockBuilder
  } as TAttemptDryRunFeeOptions<unknown, unknown>

  const mockFeeResult = (feeType: string) =>
    ({
      fee: 100n,
      feeType
    }) as TXcmFeeDetail

  const setupMocks = (results: string[]) => {
    results.forEach(type => {
      vi.mocked(getOriginXcmFeeInternal).mockResolvedValueOnce(mockFeeResult(type))
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(padFeeBy).mockImplementation(
      (amount, pct) => BigInt(amount) - (BigInt(amount) * BigInt(Math.abs(pct))) / 100n
    )

    vi.mocked(mockBuilder.currency).mockReturnValue(mockBuilder)
    vi.mocked(mockBuilder.build).mockResolvedValue(mockTx)
  })

  it('returns immediately on first dry run success', async () => {
    setupMocks(['dryRun'])

    const result = await attemptDryRunFee(mockOptions)

    expect(result.feeType).toBe('dryRun')
    expect(getOriginXcmFeeInternal).toHaveBeenCalledTimes(1)
    expect(padFeeBy).toHaveBeenCalledWith(BigInt(1000), -0)
    expect(mockBuilder.currency).toHaveBeenCalledWith({
      amount: 1000n
    })
    expect(mockBuilder.build).toHaveBeenCalledTimes(1)
  })

  it.each([
    [2, 10, ['paymentInfo', 'dryRun']],
    [3, 20, ['paymentInfo', 'paymentInfo', 'dryRun']],
    [4, 30, ['paymentInfo', 'paymentInfo', 'paymentInfo', 'dryRun']],
    [5, 40, ['paymentInfo', 'paymentInfo', 'paymentInfo', 'paymentInfo', 'dryRun']],
    [6, 50, ['paymentInfo', 'paymentInfo', 'paymentInfo', 'paymentInfo', 'paymentInfo', 'dryRun']]
  ])('returns on attempt %i with %i% reduction', async (attempt, percentage, mockResults) => {
    setupMocks(mockResults)

    const result = await attemptDryRunFee(mockOptions)

    expect(result.feeType).toBe('dryRun')
    expect(getOriginXcmFeeInternal).toHaveBeenCalledTimes(attempt)
    expect(padFeeBy).toHaveBeenLastCalledWith(BigInt(1000), -percentage)
    expect(mockBuilder.build).toHaveBeenCalledTimes(attempt)
  })

  it('returns last result when no dry run succeeds', async () => {
    const paymentInfoResults = Array<string>(6).fill('paymentInfo')
    setupMocks(paymentInfoResults)

    const result = await attemptDryRunFee(mockOptions)

    expect(result.feeType).toBe('paymentInfo')
    expect(getOriginXcmFeeInternal).toHaveBeenCalledTimes(6)
    expect(padFeeBy).toHaveBeenNthCalledWith(1, BigInt(1000), -0)
    expect(padFeeBy).toHaveBeenNthCalledWith(6, BigInt(1000), -50)
    expect(mockBuilder.build).toHaveBeenCalledTimes(6)
  })

  it('passes through all options correctly with tx from builder', async () => {
    setupMocks(['dryRun'])

    await attemptDryRunFee(mockOptions)

    expect(getOriginXcmFeeInternal).toHaveBeenCalledWith({
      api: mockOptions.api,
      currency: mockOptions.currency,
      origin: mockOptions.origin,
      destination: mockOptions.destination,
      builder: mockOptions.builder,
      tx: mockTx
    })
  })

  it('calls padFeeBy with correct reduction percentages', async () => {
    setupMocks(Array<string>(6).fill('paymentInfo'))

    await attemptDryRunFee(mockOptions)
    ;[0, 10, 20, 30, 40, 50].forEach((pct, idx) => {
      expect(padFeeBy).toHaveBeenNthCalledWith(idx + 1, BigInt(1000), -pct)
    })
  })

  it('creates modified builder with updated currency amount', async () => {
    setupMocks(['paymentInfo', 'dryRun'])

    await attemptDryRunFee(mockOptions)

    expect(mockBuilder.currency).toHaveBeenNthCalledWith(1, {
      amount: 1000n // 0% reduction
    })
    expect(mockBuilder.currency).toHaveBeenNthCalledWith(2, {
      amount: 900n // 10% reduction
    })
  })
})

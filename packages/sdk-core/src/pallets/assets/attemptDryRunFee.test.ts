import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getOriginXcmFee, padFeeBy } from '../../transfer'
import type { TGetOriginXcmFeeOptions, TXcmFeeDetail } from '../../types'
import { attemptDryRunFee } from './attemptDryRunFee'

vi.mock('../../transfer')

describe('attemptDryRunFee', () => {
  const mockOptions = {
    api: {},
    currency: { amount: '1000' },
    origin: 'Polkadot',
    destination: 'Kusama'
  } as TGetOriginXcmFeeOptions<unknown, unknown>

  const mockFeeResult = (feeType: string) =>
    ({
      fee: 100n,
      feeType
    }) as TXcmFeeDetail

  const setupMocks = (results: string[]) => {
    results.forEach(type => {
      vi.mocked(getOriginXcmFee).mockResolvedValueOnce(mockFeeResult(type))
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(padFeeBy).mockImplementation(
      (amount, pct) => BigInt(amount) - (BigInt(amount) * BigInt(Math.abs(pct))) / 100n
    )
  })

  it('returns immediately on first dry run success', async () => {
    setupMocks(['dryRun'])

    const result = await attemptDryRunFee(mockOptions)

    expect(result.feeType).toBe('dryRun')
    expect(getOriginXcmFee).toHaveBeenCalledTimes(1)
    expect(padFeeBy).toHaveBeenCalledWith(BigInt(1000), -10)
  })

  it.each([
    [2, 20, ['paymentInfo', 'dryRun']],
    [3, 30, ['paymentInfo', 'paymentInfo', 'dryRun']],
    [4, 40, ['paymentInfo', 'paymentInfo', 'paymentInfo', 'dryRun']],
    [5, 50, ['paymentInfo', 'paymentInfo', 'paymentInfo', 'paymentInfo', 'dryRun']]
  ])('returns on attempt %i with %i% reduction', async (attempt, percentage, mockResults) => {
    setupMocks(mockResults)

    const result = await attemptDryRunFee(mockOptions)

    expect(result.feeType).toBe('dryRun')
    expect(getOriginXcmFee).toHaveBeenCalledTimes(attempt)
    expect(padFeeBy).toHaveBeenLastCalledWith(BigInt(1000), -percentage)
  })

  it('returns last result when no dry run succeeds', async () => {
    const paymentInfoResults = Array<string>(5).fill('paymentInfo')
    setupMocks(paymentInfoResults)

    const result = await attemptDryRunFee(mockOptions)

    expect(result.feeType).toBe('paymentInfo')
    expect(getOriginXcmFee).toHaveBeenCalledTimes(5)
    expect(padFeeBy).toHaveBeenNthCalledWith(1, BigInt(1000), -10)
    expect(padFeeBy).toHaveBeenNthCalledWith(5, BigInt(1000), -50)
  })

  it('passes through all options correctly', async () => {
    setupMocks(['dryRun'])

    await attemptDryRunFee(mockOptions)

    expect(getOriginXcmFee).toHaveBeenCalledWith({
      ...mockOptions,
      currency: {
        amount: 900n // 10% reduction
      }
    })
  })

  it('calls padFeeBy with correct reduction percentages', async () => {
    setupMocks(Array<string>(5).fill('paymentInfo'))

    await attemptDryRunFee(mockOptions)
    ;[10, 20, 30, 40, 50].forEach((pct, idx) => {
      expect(padFeeBy).toHaveBeenNthCalledWith(idx + 1, BigInt(1000), -pct)
    })
  })
})

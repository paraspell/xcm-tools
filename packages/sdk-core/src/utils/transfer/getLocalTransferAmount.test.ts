import { getEdFromAssetOrThrow } from '@paraspell/assets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AmountTooLowError } from '../../errors'
import type { TTransferLocalOptions } from '../../types'
import { getLocalTransferAmount } from './getLocalTransferAmount'

vi.mock('@paraspell/assets')

describe('getLocalTransferAmount', () => {
  const baseOptions = {
    assetInfo: { symbol: 'ACA', amount: 20n },
    balance: 100n,
    isAmountAll: false,
    keepAlive: false
  } as TTransferLocalOptions<unknown, unknown, unknown>

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getEdFromAssetOrThrow).mockReturnValue(10n)
  })

  it('returns provided amount when not sending all', () => {
    const result = getLocalTransferAmount(baseOptions)

    expect(result).toBe(20n)
  })

  it('throws when keepAlive would violate ED', () => {
    expect(() =>
      getLocalTransferAmount({ ...baseOptions, balance: 25n, keepAlive: true }, 0n)
    ).toThrow(AmountTooLowError)
  })

  it('returns free balance when sending all without keepAlive', () => {
    const result = getLocalTransferAmount({ ...baseOptions, isAmountAll: true }, 15n)

    expect(result).toBe(85n)
  })

  it('returns free balance minus ED when sending all with keepAlive', () => {
    const result = getLocalTransferAmount(
      { ...baseOptions, isAmountAll: true, keepAlive: true },
      10n
    )

    expect(result).toBe(80n)
  })

  it('returns 0 when free balance does not cover ED with keepAlive', () => {
    const result = getLocalTransferAmount(
      { ...baseOptions, isAmountAll: true, keepAlive: true, balance: 15n },
      5n
    )

    expect(result).toBe(0n)
  })
})

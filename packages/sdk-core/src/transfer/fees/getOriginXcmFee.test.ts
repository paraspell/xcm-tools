import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { TGetOriginXcmFeeOptions, TXcmFeeDetail } from '../../types'
import { getOriginXcmFee } from './getOriginXcmFee'
import { getOriginXcmFeeInternal } from './getOriginXcmFeeInternal'

vi.mock('./getOriginXcmFeeInternal')

describe('getOriginXcmFee', () => {
  beforeEach(() => vi.clearAllMocks())

  it('merges: keeps forced fields, overwrites sufficient from real, calls internal with true then false', async () => {
    const options = {} as unknown as TGetOriginXcmFeeOptions<unknown, unknown>
    const forced = {} as TXcmFeeDetail & { forwardedXcms?: unknown; destParaId?: number }
    const real = { sufficient: false } as TXcmFeeDetail

    vi.mocked(getOriginXcmFeeInternal).mockResolvedValueOnce(forced).mockResolvedValueOnce(real)

    const res = await getOriginXcmFee(options)

    expect(getOriginXcmFeeInternal).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ useRootOrigin: true })
    )
    expect(getOriginXcmFeeInternal).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ useRootOrigin: false })
    )

    expect(res.sufficient).toBe(false)
  })

  it('sets sufficient to undefined when real.sufficient is undefined', async () => {
    const options = {} as unknown as TGetOriginXcmFeeOptions<unknown, unknown>
    const forced = { sufficient: true } as TXcmFeeDetail
    const real = {} as TXcmFeeDetail

    vi.mocked(getOriginXcmFeeInternal).mockResolvedValueOnce(forced).mockResolvedValueOnce(real)

    const res = await getOriginXcmFee(options)

    expect(res.sufficient).toBeUndefined()
  })
})

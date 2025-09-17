import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { TGetOriginXcmFeeOptions, TXcmFeeDetail } from '../../types'
import { getOriginXcmFee } from './getOriginXcmFee'
import { getOriginXcmFeeInternal } from './getOriginXcmFeeInternal'

vi.mock('./getOriginXcmFeeInternal')

describe('getOriginXcmFee', () => {
  const bypassTx = { kind: 'bypass' }
  const realTx = { kind: 'real' }

  const baseOptions = {
    txs: {
      tx: realTx as unknown,
      txBypass: bypassTx as unknown
    }
  } as TGetOriginXcmFeeOptions<unknown, unknown>

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('passes correct tx objects and merges sufficient from real', async () => {
    const options = baseOptions
    const forced = { forwardedXcms: [], destParaId: 2000, sufficient: true } as TXcmFeeDetail & {
      forwardedXcms?: unknown
      destParaId?: number
    }
    const real = { sufficient: false } as TXcmFeeDetail

    vi.mocked(getOriginXcmFeeInternal).mockResolvedValueOnce(forced).mockResolvedValueOnce(real)

    const res = await getOriginXcmFee(options)

    expect(getOriginXcmFeeInternal).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        tx: bypassTx,
        useRootOrigin: true
      })
    )
    expect(getOriginXcmFeeInternal).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        tx: realTx,
        useRootOrigin: false
      })
    )
    expect(res.sufficient).toBe(false)
    expect(res).toEqual(expect.objectContaining({ forwardedXcms: [], destParaId: 2000 }))
  })

  it('sets sufficient to undefined when real.sufficient is undefined', async () => {
    const forced = { sufficient: true } as TXcmFeeDetail
    const real = {} as TXcmFeeDetail

    vi.mocked(getOriginXcmFeeInternal).mockResolvedValueOnce(forced).mockResolvedValueOnce(real)

    const res = await getOriginXcmFee(baseOptions)

    expect(getOriginXcmFeeInternal).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ tx: bypassTx, useRootOrigin: true })
    )
    expect(getOriginXcmFeeInternal).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ tx: realTx, useRootOrigin: false })
    )
    expect(res.sufficient).toBeUndefined()
  })
})

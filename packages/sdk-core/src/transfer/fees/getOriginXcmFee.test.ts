import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { GeneralBuilder } from '../../builder'
import type {
  TGetOriginXcmFeeOptions,
  TSendBaseOptionsWithSenderAddress,
  TXcmFeeDetail
} from '../../types'
import { createTxs } from '../../utils/builder'
import { getOriginXcmFee } from './getOriginXcmFee'
import { getOriginXcmFeeInternal } from './getOriginXcmFeeInternal'

vi.mock('./getOriginXcmFeeInternal')
vi.mock('../../utils/builder')

describe('getOriginXcmFee', () => {
  const mockBuilder = {
    buildInternal: vi.fn()
  } as unknown as GeneralBuilder<unknown, unknown, TSendBaseOptionsWithSenderAddress>

  const baseOptions = {
    builder: mockBuilder
  } as TGetOriginXcmFeeOptions<unknown, unknown>

  const bypassTx = { kind: 'bypass' }
  const realTx = { kind: 'real' }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createTxs).mockResolvedValue({
      tx: realTx as unknown,
      txBypassAmount: bypassTx as unknown
    })
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

    expect(createTxs).toHaveBeenCalledWith(options, mockBuilder)
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

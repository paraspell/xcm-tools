import { isTLocation, type TLocation } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../api'
import { getParaIdImpl } from '../chains/config'
import { resolveParaId } from './resolveParaId'

vi.mock('@paraspell/sdk-common', () => ({
  isTLocation: vi.fn()
}))

vi.mock('../chains/config', () => ({
  getParaIdImpl: vi.fn()
}))

describe('resolveParaId', () => {
  const parachain = 'Acala'
  const api = { _customCtx: {} } as PolkadotApi<unknown, unknown, unknown>

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns undefined if destination is a TLocation', () => {
    vi.mocked(isTLocation).mockReturnValue(true)
    const location: TLocation = {
      parents: 1,
      interior: {}
    }
    const result = resolveParaId(100, location, api)
    expect(isTLocation).toHaveBeenCalledWith(location)
    expect(result).toBeUndefined()
  })

  it('returns the provided paraId if destination is not TLocation', () => {
    vi.mocked(isTLocation).mockReturnValue(false)
    vi.mocked(getParaIdImpl).mockReturnValue(1234)
    const result = resolveParaId(999, parachain, api)
    expect(result).toBe(999)
    expect(getParaIdImpl).not.toHaveBeenCalled()
  })

  it('calls getParaIdImpl and returns its value if paraId is undefined', () => {
    vi.mocked(isTLocation).mockReturnValue(false)
    vi.mocked(getParaIdImpl).mockReturnValue(5678)
    const result = resolveParaId(undefined, parachain, api)
    expect(getParaIdImpl).toHaveBeenCalledWith(parachain, api._customCtx)
    expect(result).toBe(5678)
  })
})

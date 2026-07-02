import { isTLocation, type TLocation } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../api'
import { resolveParaId } from './resolveParaId'

vi.mock('@paraspell/sdk-common', () => ({
  isTLocation: vi.fn()
}))

describe('resolveParaId', () => {
  const parachain = 'Acala'
  const api = { getParaId: vi.fn() } as unknown as PolkadotApi<unknown, unknown, unknown>

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
    const getParaIdSpy = vi.spyOn(api, 'getParaId').mockReturnValue(1234)
    const result = resolveParaId(999, parachain, api)
    expect(result).toBe(999)
    expect(getParaIdSpy).not.toHaveBeenCalled()
  })

  it('calls getParaId and returns its value if paraId is undefined', () => {
    vi.mocked(isTLocation).mockReturnValue(false)
    const getParaIdSpy = vi.spyOn(api, 'getParaId').mockReturnValue(5678)
    const result = resolveParaId(undefined, parachain, api)
    expect(getParaIdSpy).toHaveBeenCalledWith(parachain)
    expect(result).toBe(5678)
  })
})

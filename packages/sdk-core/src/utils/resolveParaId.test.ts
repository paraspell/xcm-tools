import { isTMultiLocation, type TMultiLocation } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getParaId } from '../nodes/config'
import { resolveParaId } from './resolveParaId'

vi.mock('@paraspell/sdk-common', () => ({
  isTMultiLocation: vi.fn()
}))

vi.mock('../nodes/config', () => ({
  getParaId: vi.fn()
}))

describe('resolveParaId', () => {
  const parachain = 'Acala'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns undefined if destination is a TMultiLocation', () => {
    vi.mocked(isTMultiLocation).mockReturnValue(true)
    const multiLocation: TMultiLocation = {
      parents: 1,
      interior: {}
    }
    const result = resolveParaId(100, multiLocation)
    expect(isTMultiLocation).toHaveBeenCalledWith(multiLocation)
    expect(result).toBeUndefined()
  })

  it('returns the provided paraId if destination is not TMultiLocation', () => {
    vi.mocked(isTMultiLocation).mockReturnValue(false)
    vi.mocked(getParaId).mockReturnValue(1234)
    const result = resolveParaId(999, parachain)
    expect(result).toBe(999)
    expect(getParaId).not.toHaveBeenCalled()
  })

  it('calls getParaId and returns its value if paraId is undefined', () => {
    vi.mocked(isTMultiLocation).mockReturnValue(false)
    vi.mocked(getParaId).mockReturnValue(5678)
    const result = resolveParaId(undefined, parachain)
    expect(getParaId).toHaveBeenCalledWith(parachain)
    expect(result).toBe(5678)
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../pallets/xcmPallet/utils', () => ({
  isTMultiLocation: vi.fn()
}))
vi.mock('.', () => ({
  isRelayChain: vi.fn()
}))
vi.mock('../nodes/config', () => ({
  getParaId: vi.fn()
}))

import { getParaId } from '../nodes/config'
import { isTMultiLocation } from '../pallets/xcmPallet/utils'
import type { TMultiLocation } from '../types'
import { isRelayChain } from '.'
import { resolveParaId } from './resolveParaId'

describe('resolveParaId', () => {
  const parachain = 'Acala'
  const relaychain = 'Polkadot'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns undefined if destination is a TMultiLocation', () => {
    vi.mocked(isTMultiLocation).mockReturnValue(true)
    vi.mocked(isRelayChain).mockReturnValue(false)
    const multiLocation: TMultiLocation = {
      parents: 1,
      interior: {}
    }
    const result = resolveParaId(100, multiLocation)
    expect(isTMultiLocation).toHaveBeenCalledWith(multiLocation)
    expect(result).toBeUndefined()
  })

  it('returns undefined if destination is Relay Chain', () => {
    vi.mocked(isTMultiLocation).mockReturnValue(false)
    vi.mocked(isRelayChain).mockReturnValue(true)
    const result = resolveParaId(100, relaychain)
    expect(isTMultiLocation).toHaveBeenCalledWith(relaychain)
    expect(result).toBeUndefined()
  })

  it('returns undefined if destination is "Ethereum"', () => {
    vi.mocked(isTMultiLocation).mockReturnValue(false)
    vi.mocked(isRelayChain).mockReturnValue(false)
    const result = resolveParaId(999, 'Ethereum')
    expect(result).toBeUndefined()
  })

  it('returns the provided paraId if destination is not TMultiLocation/RelayChain/Ethereum', () => {
    vi.mocked(isTMultiLocation).mockReturnValue(false)
    vi.mocked(isRelayChain).mockReturnValue(false)
    vi.mocked(getParaId).mockReturnValue(1234)
    const result = resolveParaId(999, parachain)
    expect(result).toBe(999)
    expect(getParaId).not.toHaveBeenCalled()
  })

  it('calls getParaId and returns its value if paraId is undefined', () => {
    vi.mocked(isTMultiLocation).mockReturnValue(false)
    vi.mocked(isRelayChain).mockReturnValue(false)
    vi.mocked(getParaId).mockReturnValue(5678)
    const result = resolveParaId(undefined, parachain)
    expect(getParaId).toHaveBeenCalledWith(parachain)
    expect(result).toBe(5678)
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { XTokensTransferInput } from '../../types'
import { Version } from '../../types'
import XTokensTransferImpl from '../xTokens'
import { getNode } from '../../utils/getNode'
import type Amplitude from './Amplitude'

vi.mock('../xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('Amplitude', () => {
  let amplitude: Amplitude
  const mockInput = {
    currencyID: '123',
    amount: '100'
  } as XTokensTransferInput

  beforeEach(() => {
    amplitude = getNode('Amplitude')
  })

  it('should initialize with correct values', () => {
    expect(amplitude.node).toBe('Amplitude')
    expect(amplitude.name).toBe('amplitude')
    expect(amplitude.type).toBe('kusama')
    expect(amplitude.version).toBe(Version.V3)
  })

  it('should call transferXTokens with XCM asset selection', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')

    amplitude.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, { XCM: '123' })
  })
})

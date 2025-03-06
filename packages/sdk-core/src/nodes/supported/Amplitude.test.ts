import { beforeEach, describe, expect, it, vi } from 'vitest'

import XTokensTransferImpl from '../../pallets/xTokens'
import type { TXTokensTransferOptions } from '../../types'
import { Version } from '../../types'
import { getNode } from '../../utils/getNode'
import type Amplitude from './Amplitude'

vi.mock('../../pallets/xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('Amplitude', () => {
  let amplitude: Amplitude<unknown, unknown>
  const mockInput = {
    asset: { symbol: 'AMPE', assetId: '123', amount: '100' }
  } as TXTokensTransferOptions<unknown, unknown>

  beforeEach(() => {
    amplitude = getNode<unknown, unknown, 'Amplitude'>('Amplitude')
  })

  it('should initialize with correct values', () => {
    expect(amplitude.node).toBe('Amplitude')
    expect(amplitude.info).toBe('amplitude')
    expect(amplitude.type).toBe('kusama')
    expect(amplitude.version).toBe(Version.V3)
  })

  it('should call transferXTokens with XCM asset selection', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')

    amplitude.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, { XCM: 123 })
  })
})

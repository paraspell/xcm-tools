import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { transferXTokens } from '../../pallets/xTokens'
import type { TXTokensTransferOptions } from '../../types'
import { getChain } from '../../utils/getChain'
import type Amplitude from './Amplitude'

vi.mock('../../pallets/xTokens')

describe('Amplitude', () => {
  let amplitude: Amplitude<unknown, unknown>
  const mockInput = {
    asset: { symbol: 'AMPE', assetId: '123', amount: 100n }
  } as TXTokensTransferOptions<unknown, unknown>

  beforeEach(() => {
    amplitude = getChain<unknown, unknown, 'Amplitude'>('Amplitude')
  })

  it('should initialize with correct values', () => {
    expect(amplitude.chain).toBe('Amplitude')
    expect(amplitude.info).toBe('amplitude')
    expect(amplitude.ecosystem).toBe('Kusama')
    expect(amplitude.version).toBe(Version.V3)
  })

  it('should call transferXTokens with XCM asset selection', () => {
    amplitude.transferXTokens(mockInput)
    expect(transferXTokens).toHaveBeenCalledWith(mockInput, { XCM: 123 })
  })
})

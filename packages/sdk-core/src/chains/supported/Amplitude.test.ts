import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { transferXTokens } from '../../pallets/xTokens'
import type { TXTokensTransferOptions } from '../../types'
import { getChain } from '../../utils/getChain'
import type Amplitude from './Amplitude'

vi.mock('../../pallets/xTokens')

describe('Amplitude', () => {
  let chain: Amplitude<unknown, unknown>

  const mockInput = {
    asset: { symbol: 'AMPE', assetId: '123', amount: 100n }
  } as TXTokensTransferOptions<unknown, unknown>

  beforeEach(() => {
    chain = getChain<unknown, unknown, 'Amplitude'>('Amplitude')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('Amplitude')
    expect(chain.info).toBe('amplitude')
    expect(chain.ecosystem).toBe('Kusama')
    expect(chain.version).toBe(Version.V3)
  })

  it('should call transferXTokens with XCM asset selection', () => {
    chain.transferXTokens(mockInput)
    expect(transferXTokens).toHaveBeenCalledWith(mockInput, { XCM: 123 })
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { XTokensTransferInput, TMantaAsset } from '../../types'
import { Version } from '../../types'
import XTokensTransferImpl from '../xTokens'
import type Manta from './Manta'
import { getNode } from '../../utils'

vi.mock('../xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('Manta', () => {
  let manta: Manta
  const mockInput = {
    currencyID: '123',
    amount: '100'
  } as XTokensTransferInput

  beforeEach(() => {
    manta = getNode('Manta')
  })

  it('should initialize with correct values', () => {
    expect(manta.node).toBe('Manta')
    expect(manta.name).toBe('manta')
    expect(manta.type).toBe('polkadot')
    expect(manta.version).toBe(Version.V3)
  })

  it('should call transferXTokens with MantaCurrency selection', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')

    manta.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, { MantaCurrency: '123' } as TMantaAsset)
  })
})

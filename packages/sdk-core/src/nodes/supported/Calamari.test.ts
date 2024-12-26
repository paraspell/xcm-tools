import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TXTokensTransferOptions } from '../../types'
import { Version } from '../../types'
import XTokensTransferImpl from '../xTokens'
import type Calamari from './Calamari'
import { getNode } from '../../utils'

vi.mock('../xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('Calamari', () => {
  let calamari: Calamari<unknown, unknown>
  const mockInput = {
    asset: { assetId: '123', amount: '100' }
  } as TXTokensTransferOptions<unknown, unknown>

  beforeEach(() => {
    calamari = getNode<unknown, unknown, 'Calamari'>('Calamari')
  })

  it('should initialize with correct values', () => {
    expect(calamari.node).toBe('Calamari')
    expect(calamari.info).toBe('calamari')
    expect(calamari.type).toBe('kusama')
    expect(calamari.version).toBe(Version.V3)
  })

  it('should call transferXTokens with MantaCurrency', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')

    calamari.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, { MantaCurrency: BigInt('123') })
  })
})

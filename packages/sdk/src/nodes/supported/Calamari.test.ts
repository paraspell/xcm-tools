import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { XTokensTransferInput } from '../../types'
import { Version } from '../../types'
import XTokensTransferImpl from '../xTokens'
import type Calamari from './Calamari'
import { getNode } from '../../utils'
import type { ApiPromise } from '@polkadot/api'
import type { Extrinsic } from '../../pjs/types'

vi.mock('../xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('Calamari', () => {
  let calamari: Calamari<ApiPromise, Extrinsic>
  const mockInput = {
    currencyID: '123',
    amount: '100'
  } as XTokensTransferInput<ApiPromise, Extrinsic>

  beforeEach(() => {
    calamari = getNode<ApiPromise, Extrinsic, 'Calamari'>('Calamari')
  })

  it('should initialize with correct values', () => {
    expect(calamari.node).toBe('Calamari')
    expect(calamari.name).toBe('calamari')
    expect(calamari.type).toBe('kusama')
    expect(calamari.version).toBe(Version.V3)
  })

  it('should call transferXTokens with MantaCurrency', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')

    calamari.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, { MantaCurrency: BigInt('123') })
  })
})

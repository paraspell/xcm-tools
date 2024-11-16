import { describe, it, expect, vi, beforeEach } from 'vitest'
import { InvalidCurrencyError, NodeNotSupportedError } from '../../errors'
import type { XTokensTransferInput } from '../../types'
import { Version } from '../../types'
import XTokensTransferImpl from '../xTokens'
import type Integritee from './Integritee'
import { getNode } from '../../utils'
import type { ApiPromise } from '@polkadot/api'
import type { Extrinsic } from '../../pjs/types'

vi.mock('../xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('Integritee', () => {
  let integritee: Integritee<ApiPromise, Extrinsic>
  const mockInput = {
    asset: { symbol: 'TEER' },
    amount: '100'
  } as XTokensTransferInput<ApiPromise, Extrinsic>

  beforeEach(() => {
    integritee = getNode<ApiPromise, Extrinsic, 'Integritee'>('Integritee')
  })

  it('should initialize with correct values', () => {
    expect(integritee.node).toBe('Integritee')
    expect(integritee.info).toBe('integritee')
    expect(integritee.type).toBe('kusama')
    expect(integritee.version).toBe(Version.V3)
  })

  it('should call transferXTokens with valid currency', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')

    integritee.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, 'TEER')
  })

  it('should throw InvalidCurrencyError for unsupported currency KSM', () => {
    const invalidInput = { ...mockInput, asset: { symbol: 'KSM' } }

    expect(() => integritee.transferXTokens(invalidInput)).toThrowError(
      new InvalidCurrencyError('Node Integritee does not support currency KSM')
    )
  })

  it('should throw NodeNotSupportedError for transferRelayToPara', () => {
    expect(() => integritee.transferRelayToPara()).toThrowError(NodeNotSupportedError)
  })
})

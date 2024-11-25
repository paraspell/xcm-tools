import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TXTokensTransferOptions } from '../../types'
import { Version } from '../../types'
import XTokensTransferImpl from '../xTokens'
import type Manta from './Manta'
import { getNode } from '../../utils'
import type { ApiPromise } from '@polkadot/api'
import type { Extrinsic } from '../../pjs/types'

vi.mock('../xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('Manta', () => {
  let manta: Manta<ApiPromise, Extrinsic>
  const mockInput = {
    asset: { assetId: '123' },
    amount: '100'
  } as TXTokensTransferOptions<ApiPromise, Extrinsic>

  beforeEach(() => {
    manta = getNode<ApiPromise, Extrinsic, 'Manta'>('Manta')
  })

  it('should initialize with correct values', () => {
    expect(manta.node).toBe('Manta')
    expect(manta.info).toBe('manta')
    expect(manta.type).toBe('polkadot')
    expect(manta.version).toBe(Version.V3)
  })

  it('should call transferXTokens with MantaCurrency selection', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')

    manta.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, { MantaCurrency: BigInt('123') })
  })
})

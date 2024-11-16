import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PolkadotXCMTransferInput } from '../../types'
import { Version } from '../../types'
import PolkadotXCMTransferImpl from '../polkadotXcm'
import { getNode } from '../../utils'
import type { ApiPromise } from '@polkadot/api'
import type { Extrinsic } from '../../pjs/types'
import type Nodle from './Nodle'

vi.mock('../polkadotXcm', () => ({
  default: {
    transferPolkadotXCM: vi.fn()
  }
}))

describe('Nodle', () => {
  let nodle: Nodle<ApiPromise, Extrinsic>
  const mockInput = {
    asset: { symbol: 'NODL' },
    amount: '100',
    scenario: 'ParaToPara'
  } as PolkadotXCMTransferInput<ApiPromise, Extrinsic>

  beforeEach(() => {
    nodle = getNode<ApiPromise, Extrinsic, 'Nodle'>('Nodle')
  })

  it('should initialize with correct values', () => {
    expect(nodle.node).toBe('Nodle')
    expect(nodle.info).toBe('nodle')
    expect(nodle.type).toBe('polkadot')
    expect(nodle.version).toBe(Version.V3)
  })

  it('should call transferPolkadotXCM with the correct arguments', async () => {
    const spy = vi.spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')

    await nodle.transferPolkadotXCM(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, 'limited_reserve_transfer_assets', 'Unlimited')
  })
})

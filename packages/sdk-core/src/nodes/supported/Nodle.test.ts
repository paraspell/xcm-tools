import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { Version } from '../../types'
import PolkadotXCMTransferImpl from '../../pallets/polkadotXcm'
import { getNode } from '../../utils'
import type Nodle from './Nodle'

vi.mock('../../pallets/polkadotXcm', () => ({
  default: {
    transferPolkadotXCM: vi.fn()
  }
}))

describe('Nodle', () => {
  let nodle: Nodle<unknown, unknown>
  const mockInput = {
    asset: { symbol: 'NODL', amount: '100' },
    scenario: 'ParaToPara'
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  beforeEach(() => {
    nodle = getNode<unknown, unknown, 'Nodle'>('Nodle')
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

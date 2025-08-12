import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { getChain } from '../../utils'
import type Nodle from './Nodle'

vi.mock('../../pallets/polkadotXcm', () => ({
  transferPolkadotXcm: vi.fn()
}))

describe('Nodle', () => {
  let nodle: Nodle<unknown, unknown>
  const mockInput = {
    assetInfo: { symbol: 'NODL', amount: 100n },
    scenario: 'ParaToPara'
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  beforeEach(() => {
    nodle = getChain<unknown, unknown, 'Nodle'>('Nodle')
  })

  it('should initialize with correct values', () => {
    expect(nodle.chain).toBe('Nodle')
    expect(nodle.info).toBe('nodle')
    expect(nodle.ecosystem).toBe('Polkadot')
    expect(nodle.version).toBe(Version.V4)
  })

  it('should call transferPolkadotXCM with the correct arguments', async () => {
    await nodle.transferPolkadotXCM(mockInput)
    expect(transferPolkadotXcm).toHaveBeenCalledWith(
      mockInput,
      'limited_reserve_transfer_assets',
      'Unlimited'
    )
  })
})

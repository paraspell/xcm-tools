import { beforeEach, describe, expect, it, vi } from 'vitest'

import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { getNode } from '../../utils'
import RobonomicsKusama from './RobonomicsKusama'

vi.mock('../../pallets/polkadotXcm', () => ({
  transferPolkadotXcm: vi.fn()
}))

describe('Robonomics', () => {
  let robonomics: RobonomicsKusama<unknown, unknown>

  beforeEach(() => {
    robonomics = getNode<unknown, unknown, 'RobonomicsKusama'>('RobonomicsKusama')
  })

  it('should be instantiated correctly', () => {
    expect(robonomics).toBeInstanceOf(RobonomicsKusama)
  })
  it('should use limitedTeleportAssets when scenario is not ParaToPara', async () => {
    const input = { scenario: 'ParaToRelay' } as TPolkadotXCMTransferOptions<unknown, unknown>
    await robonomics.transferPolkadotXCM(input)
    expect(transferPolkadotXcm).toHaveBeenCalledWith(
      input,
      'limited_reserve_transfer_assets',
      'Unlimited'
    )
  })
})

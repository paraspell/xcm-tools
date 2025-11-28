import { beforeEach, describe, expect, it, vi } from 'vitest'

import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions, TSendInternalOptions } from '../../types'
import { getChain } from '../../utils'
import RobonomicsKusama from './RobonomicsKusama'

vi.mock('../../pallets/polkadotXcm')

describe('Robonomics', () => {
  let chain: RobonomicsKusama<unknown, unknown>

  const sendOptions = {} as unknown as TSendInternalOptions<unknown, unknown>

  beforeEach(() => {
    chain = getChain<unknown, unknown, 'RobonomicsKusama'>('RobonomicsKusama')
  })

  it('should be instantiated correctly', () => {
    expect(chain).toBeInstanceOf(RobonomicsKusama)
  })

  it('should use limitedTeleportAssets when scenario is not ParaToPara', async () => {
    const input = { scenario: 'ParaToRelay' } as TPolkadotXCMTransferOptions<unknown, unknown>
    await chain.transferPolkadotXCM(input)
    expect(transferPolkadotXcm).toHaveBeenCalledWith(
      input,
      'limited_reserve_transfer_assets',
      'Unlimited'
    )
  })

  it('isSendingTempDisabled should return true', () => {
    expect(chain.isSendingTempDisabled(sendOptions)).toBe(true)
  })

  it('isReceivingTempDisabled should return true', () => {
    expect(chain.isReceivingTempDisabled('ParaToPara')).toBe(true)
  })
})

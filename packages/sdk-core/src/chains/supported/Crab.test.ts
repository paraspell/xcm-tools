import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { getChain } from '../../utils'
import type Crab from './Crab'

vi.mock('../../pallets/polkadotXcm')

describe('Crab', () => {
  let crab: Crab<unknown, unknown>
  const mockInput = {
    scenario: 'ParaToPara',
    assetInfo: { symbol: 'KSM', amount: 100n }
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  beforeEach(() => {
    crab = getChain<unknown, unknown, 'Crab'>('Crab')
  })

  it('should initialize with correct values', () => {
    expect(crab.chain).toBe('Crab')
    expect(crab.info).toBe('crab')
    expect(crab.ecosystem).toBe('Kusama')
    expect(crab.version).toBe(Version.V4)
  })

  it('should throw ScenarioNotSupportedError for ParaToRelay scenario', () => {
    const invalidInput = { ...mockInput, scenario: 'ParaToRelay' } as TPolkadotXCMTransferOptions<
      unknown,
      unknown
    >

    expect(() => crab.transferPolkadotXCM(invalidInput)).toThrow(ScenarioNotSupportedError)
  })

  it('should call transferPolkadotXCM with limited_reserve_transfer_assets for non-ParaToPara scenario', async () => {
    await crab.transferPolkadotXCM(mockInput)
    expect(transferPolkadotXcm).toHaveBeenCalledWith(
      mockInput,
      'limited_reserve_transfer_assets',
      'Unlimited'
    )
  })

  it('should throw ScenarioNotSupportedError when calling transferRelayToPara', () => {
    expect(() => crab.transferRelayToPara()).toThrow(ScenarioNotSupportedError)
  })
})

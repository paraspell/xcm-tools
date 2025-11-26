import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ChainNotSupportedError, ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { getChain } from '../../utils/getChain'
import type EnergyWebX from './EnergyWebX'

vi.mock('../../pallets/polkadotXcm')

describe('EnergyWebX', () => {
  let chain: EnergyWebX<unknown, unknown>

  beforeEach(() => {
    chain = getChain<unknown, unknown, 'EnergyWebX'>('EnergyWebX')
    vi.clearAllMocks()
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('EnergyWebX')
    expect(chain.info).toBe('ewx')
    expect(chain.ecosystem).toBe('Polkadot')
    expect(chain.version).toBe(Version.V3)
  })

  it('should handle ParaToPara transfers correctly', async () => {
    const input = {
      scenario: 'ParaToPara',
      assetInfo: { symbol: 'DOT', amount: 100n }
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    await chain.transferPolkadotXCM(input)

    expect(transferPolkadotXcm).toHaveBeenCalledWith(
      input,
      'limited_reserve_transfer_assets',
      'Unlimited'
    )
  })

  it('should throw ScenarioNotSupportedError for non-ParaToPara scenarios', () => {
    const scenarios = ['RelayToPara', 'ParaToRelay'] as const

    scenarios.forEach(scenario => {
      const input = {
        scenario,
        assetInfo: { symbol: 'DOT', amount: 100n }
      } as TPolkadotXCMTransferOptions<unknown, unknown>

      expect(() => chain.transferPolkadotXCM(input)).toThrow(
        new ScenarioNotSupportedError('EnergyWebX', scenario)
      )
    })
  })

  it('should throw ChainNotSupportedError for transferRelayToPara', () => {
    expect(() => chain.transferRelayToPara()).toThrow(ChainNotSupportedError)
  })
})

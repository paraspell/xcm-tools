import { InvalidCurrencyError } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { getChain } from '../../utils'
import type Nodle from './Nodle'

vi.mock('../../pallets/polkadotXcm')

describe('Nodle', () => {
  let chain: Nodle<unknown, unknown>

  const mockInput = {
    assetInfo: { symbol: 'NODL', amount: 100n },
    scenario: 'ParaToPara'
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  beforeEach(() => {
    chain = getChain<unknown, unknown, 'Nodle'>('Nodle')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('Nodle')
    expect(chain.info).toBe('nodle')
    expect(chain.ecosystem).toBe('Polkadot')
    expect(chain.version).toBe(Version.V4)
  })

  it('should call transferPolkadotXCM with the correct arguments', async () => {
    await chain.transferPolkadotXCM(mockInput)
    expect(transferPolkadotXcm).toHaveBeenCalledWith(mockInput)
  })

  it('should throw ScenarioNotSupportedError for non-ParaToPara scenarios', () => {
    const scenarios = ['RelayToPara', 'ParaToRelay'] as const

    scenarios.forEach(scenario => {
      const input = {
        scenario,
        assetInfo: { symbol: 'DOT', amount: 100n }
      } as TPolkadotXCMTransferOptions<unknown, unknown>

      expect(() => chain.transferPolkadotXCM(input)).toThrow(ScenarioNotSupportedError)
    })
  })

  it('should only support native currency', () => {
    const input = {
      scenario: 'ParaToPara',
      assetInfo: { symbol: 'XYZ' }
    } as TPolkadotXCMTransferOptions<unknown, unknown>
    expect(() => chain.transferPolkadotXCM(input)).toThrow(InvalidCurrencyError)
  })

  it('should throw ScenarioNotSupportedError when calling transferRelayToPara', () => {
    expect(() => chain.transferRelayToPara()).toThrow(ScenarioNotSupportedError)
  })
})

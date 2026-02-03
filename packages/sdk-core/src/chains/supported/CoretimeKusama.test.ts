import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { getChain } from '../../utils'
import type CoretimeKusama from './CoretimeKusama'

vi.mock('../../pallets/polkadotXcm')

describe('CoretimeKusama', () => {
  let chain: CoretimeKusama<unknown, unknown, unknown>

  const mockInput = {
    scenario: 'ParaToPara',
    assetInfo: { symbol: 'KSM', amount: 100n }
  } as TPolkadotXCMTransferOptions<unknown, unknown, unknown>

  beforeEach(() => {
    chain = getChain<unknown, unknown, unknown, 'CoretimeKusama'>('CoretimeKusama')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('CoretimeKusama')
    expect(chain.info).toBe('kusamaCoretime')
    expect(chain.ecosystem).toBe('Kusama')
    expect(chain.version).toBe(Version.V5)
  })

  it('throws ScenarioNotSupportedError for ParaToPara scenario', () => {
    expect(() => chain.transferPolkadotXCM(mockInput)).toThrow(ScenarioNotSupportedError)
    expect(transferPolkadotXcm).not.toHaveBeenCalled()
  })

  it('should call transferPolkadotXCM for non-ParaToPara scenario', async () => {
    const inputWithDifferentScenario = {
      ...mockInput,
      scenario: 'RelayToPara'
    } as TPolkadotXCMTransferOptions<unknown, unknown, unknown>

    await chain.transferPolkadotXCM(inputWithDifferentScenario)

    expect(transferPolkadotXcm).toHaveBeenCalledWith(inputWithDifferentScenario)
  })
})

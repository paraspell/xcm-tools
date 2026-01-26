import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { getChain } from '../../utils'
import type Crab from './Crab'

vi.mock('../../pallets/polkadotXcm')

describe('Crab', () => {
  let chain: Crab<unknown, unknown>

  const mockInput = {
    scenario: 'ParaToPara',
    assetInfo: { symbol: 'KSM', amount: 100n }
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  beforeEach(() => {
    chain = getChain<unknown, unknown, 'Crab'>('Crab')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('Crab')
    expect(chain.info).toBe('crab')
    expect(chain.ecosystem).toBe('Kusama')
    expect(chain.version).toBe(Version.V4)
  })

  it('should throw ScenarioNotSupportedError for ParaToRelay scenario', () => {
    const invalidInput = { ...mockInput, scenario: 'ParaToRelay' } as TPolkadotXCMTransferOptions<
      unknown,
      unknown
    >

    expect(() => chain.transferPolkadotXCM(invalidInput)).toThrow(ScenarioNotSupportedError)
  })

  it('should call transferPolkadotXCM for non-ParaToPara scenario', async () => {
    await chain.transferPolkadotXCM(mockInput)
    expect(transferPolkadotXcm).toHaveBeenCalledWith(mockInput)
  })

  it('should return false for isRelayToParaEnabled', () => {
    expect(chain.isRelayToParaEnabled()).toBe(false)
  })
})

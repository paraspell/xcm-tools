import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { getChain } from '../../utils'
import type BridgeHubKusama from './BridgeHubKusama'

vi.mock('../../pallets/polkadotXcm')

describe('BridgeHubKusama', () => {
  let chain: BridgeHubKusama<unknown, unknown, unknown>

  const mockInput = {
    scenario: 'RelayToPara',
    assetInfo: { symbol: 'KSM', amount: 100n }
  } as TPolkadotXCMTransferOptions<unknown, unknown, unknown>

  beforeEach(() => {
    chain = getChain<unknown, unknown, unknown, 'BridgeHubKusama'>('BridgeHubKusama')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('BridgeHubKusama')
    expect(chain.info).toBe('kusamaBridgeHub')
    expect(chain.ecosystem).toBe('Kusama')
    expect(chain.version).toBe(Version.V5)
  })

  it('should throw ScenarioNotSupportedError for ParaToPara scenario', () => {
    const invalidInput = { ...mockInput, scenario: 'ParaToPara' } as TPolkadotXCMTransferOptions<
      unknown,
      unknown,
      unknown
    >

    expect(() => chain.transferPolkadotXCM(invalidInput)).toThrow(ScenarioNotSupportedError)
  })

  it('should call transferPolkadotXCM for non-ParaToPara scenario', async () => {
    await chain.transferPolkadotXCM(mockInput)
    expect(transferPolkadotXcm).toHaveBeenCalledWith(mockInput)
  })
})

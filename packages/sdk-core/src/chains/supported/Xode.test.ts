import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { getChain } from '../../utils'
import type Xode from './Xode'

vi.mock('../../pallets/polkadotXcm')

describe('Xode', () => {
  let chain: Xode<unknown, unknown>

  const mockInput = {
    scenario: 'ParaToPara',
    destChain: 'AssetHubPolkadot',
    assetInfo: { symbol: 'XYZ', location: {} }
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  beforeEach(() => {
    chain = getChain<unknown, unknown, 'Xode'>('Xode')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('Xode')
    expect(chain.info).toBe('xode')
    expect(chain.ecosystem).toBe('Polkadot')
    expect(chain.version).toBe(Version.V4)
  })

  it('should create typeAndThen call when transferPolkadotXcm is invoked', async () => {
    await chain.transferPolkadotXCM(mockInput)
    expect(transferPolkadotXcm).toHaveBeenCalledWith(mockInput)
  })

  it('transferPolkadotXCM should throw ScenarioNotSupportedError for unsupported destChain', () => {
    expect(() => chain.transferPolkadotXCM({ ...mockInput, destChain: 'Moonbeam' })).toThrow(
      ScenarioNotSupportedError
    )
  })
})

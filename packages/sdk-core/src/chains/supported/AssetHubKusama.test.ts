import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import { type TPolkadotXCMTransferOptions } from '../../types'
import { getChain } from '../../utils'
import type AssetHubKusama from './AssetHubKusama'

vi.mock('../../pallets/polkadotXcm')

describe('transferPolkadotXCM', () => {
  let chain: AssetHubKusama<unknown, unknown>

  const mockInput = {
    assetInfo: {
      symbol: 'DOT',
      assetId: '123'
    },
    scenario: 'ParaToPara'
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  beforeEach(() => {
    vi.clearAllMocks()
    chain = getChain<unknown, unknown, 'AssetHubKusama'>('AssetHubKusama')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('AssetHubKusama')
    expect(chain.info).toBe('KusamaAssetHub')
    expect(chain.ecosystem).toBe('Kusama')
    expect(chain.version).toBe(Version.V5)
  })

  it('should create typeAndThen call when transferPolkadotXcm is invoked', async () => {
    await chain.transferPolkadotXCM(mockInput)
    expect(transferPolkadotXcm).toHaveBeenCalledWith(mockInput)
  })

  it('throws ScenarioNotSupportedError for native DOT transfers in para to para scenarios', () => {
    const input = {
      ...mockInput,
      assetInfo: { symbol: 'DOT' }
    } as TPolkadotXCMTransferOptions<unknown, unknown>
    expect(() => chain.transferPolkadotXCM(input)).toThrow(ScenarioNotSupportedError)
  })
})

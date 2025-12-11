import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ScenarioNotSupportedError } from '../../errors'
import { type TPolkadotXCMTransferOptions } from '../../types'
import { getChain } from '../../utils'
import type AssetHubKusama from './AssetHubKusama'

describe('transferPolkadotXCM', () => {
  let chain: AssetHubKusama<unknown, unknown>

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

  it('throws ScenarioNotSupportedError for native DOT transfers in para to para scenarios', () => {
    const assetHub = getChain('AssetHubKusama')
    const input = {
      assetInfo: {
        symbol: 'DOT',
        isNative: true
      },
      scenario: 'ParaToPara',
      destination: 'Karura'
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    expect(() => assetHub.transferPolkadotXCM(input)).toThrow(ScenarioNotSupportedError)
  })

  describe('getMethod', () => {
    it('should return limited_reserve_transfer_assets for ParaToPara to non-trusted chain', () => {
      const method = chain.getMethod('ParaToPara', 'Karura')
      expect(method).toBe('limited_reserve_transfer_assets')
    })

    it('should return limited_teleport_assets for ParaToRelay scenario', () => {
      const method = chain.getMethod('ParaToRelay', 'Kusama')
      expect(method).toBe('limited_teleport_assets')
    })

    it('should return limited_teleport_assets for RelayToPara scenario', () => {
      const method = chain.getMethod('RelayToPara', 'Karura')
      expect(method).toBe('limited_teleport_assets')
    })

    it('should return limited_teleport_assets for ParaToPara to trusted chain', () => {
      const method = chain.getMethod('ParaToPara', 'AssetHubKusama')
      expect(method).toBe('limited_teleport_assets')
    })
  })

  it('should call getRelayToParaOverrides with the correct parameters', () => {
    const result = chain.getRelayToParaOverrides()
    expect(result).toEqual({
      transferType: 'teleport'
    })
  })
})

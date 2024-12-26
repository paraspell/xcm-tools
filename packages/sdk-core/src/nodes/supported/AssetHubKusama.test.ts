import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ScenarioNotSupportedError } from '../../errors'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { getNode } from '../../utils'
import type AssetHubKusama from './AssetHubKusama'

describe('transferPolkadotXCM', () => {
  let node: AssetHubKusama<unknown, unknown>

  beforeEach(() => {
    vi.clearAllMocks()
    node = getNode<unknown, unknown, 'AssetHubKusama'>('AssetHubKusama')
  })

  it('throws ScenarioNotSupportedError for native KSM transfers in para to para scenarios', () => {
    const input = {
      asset: {
        symbol: 'KSM'
      },
      scenario: 'ParaToPara',
      destination: 'Karura'
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    expect(() => node.transferPolkadotXCM(input)).toThrow(ScenarioNotSupportedError)
  })

  it('throws ScenarioNotSupportedError for native DOT transfers in para to para scenarios', () => {
    const assetHub = getNode('AssetHubKusama')
    const input = {
      asset: {
        symbol: 'DOT'
      },
      scenario: 'ParaToPara',
      destination: 'Karura'
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    expect(() => assetHub.transferPolkadotXCM(input)).toThrow(ScenarioNotSupportedError)
  })

  it('should call getRelayToParaOverrides with the correct parameters', () => {
    const result = node.getRelayToParaOverrides()
    expect(result).toEqual({
      section: 'limited_teleport_assets',
      includeFee: true
    })
  })
})

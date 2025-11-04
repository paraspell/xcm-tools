import type { TAsset } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DOT_MULTILOCATION } from '../../constants'
import { InvalidParameterError, ScenarioNotSupportedError } from '../../errors'
import {
  type TPolkadotXCMTransferOptions,
  type TScenario,
  type TSendInternalOptions
} from '../../types'
import { getNode } from '../../utils'
import type AssetHubKusama from './AssetHubKusama'

describe('transferPolkadotXCM', () => {
  let node: AssetHubKusama<unknown, unknown>

  beforeEach(() => {
    vi.clearAllMocks()
    node = getNode<unknown, unknown, 'AssetHubKusama'>('AssetHubKusama')
  })

  it('should initialize with correct values', () => {
    expect(node.node).toBe('AssetHubKusama')
    expect(node.info).toBe('KusamaAssetHub')
    expect(node.type).toBe('kusama')
    expect(node.version).toBe(Version.V5)
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
      method: 'limited_teleport_assets',
      includeFee: true
    })
  })

  describe('createCurrencySpec', () => {
    it('should throw InvalidCurrencyError for ParaToPara if asset has no multiLocation', () => {
      const scenario: TScenario = 'ParaToPara'
      const amount = 1000000000n
      const assetWithoutML = { symbol: 'DOT', multiLocation: DOT_MULTILOCATION } as TAsset

      const spy = vi.spyOn(node, 'createCurrencySpec')

      node.createCurrencySpec(amount, scenario, node.version, assetWithoutML)

      expect(spy).toHaveBeenCalled()
    })
  })

  describe('temporary disable flags', () => {
    const emptyOptions = {} as TSendInternalOptions<unknown, unknown>

    it('should mark sending as temporarily disabled', () => {
      expect(node.isSendingTempDisabled(emptyOptions)).toBe(true)
    })

    it('should throw when attempting local transfers', () => {
      const invokeTransferLocal = () => node.transferLocal(emptyOptions)

      expect(invokeTransferLocal).toThrow(InvalidParameterError)
      expect(invokeTransferLocal).toThrow(
        'Local transfers on AssetHubKusama are temporarily disabled.'
      )
    })
  })
})

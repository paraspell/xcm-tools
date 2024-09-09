import { describe, it, expect } from 'vitest'
import { ScenarioNotSupportedError } from '../../errors'
import { PolkadotXCMTransferInput } from '../../types'
import { getNode } from '../../utils'

describe('transferPolkadotXCM', () => {
  it('throws ScenarioNotSupportedError for native KSM transfers in para to para scenarios', () => {
    const assetHub = getNode('AssetHubKusama')
    const input = {
      currencySymbol: 'KSM',
      currencyId: undefined,
      scenario: 'ParaToPara',
      destination: 'Karura'
    } as PolkadotXCMTransferInput

    expect(() => assetHub.transferPolkadotXCM(input)).toThrow(ScenarioNotSupportedError)
  })

  it('throws ScenarioNotSupportedError for native DOT transfers in para to para scenarios', () => {
    const assetHub = getNode('AssetHubKusama')
    const input = {
      currencySymbol: 'DOT',
      currencyId: undefined,
      scenario: 'ParaToPara',
      destination: 'Karura'
    } as PolkadotXCMTransferInput

    expect(() => assetHub.transferPolkadotXCM(input)).toThrow(ScenarioNotSupportedError)
  })
})

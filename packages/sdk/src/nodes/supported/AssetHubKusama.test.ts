import { describe, it, expect } from 'vitest'
import { ScenarioNotSupportedError } from '../../errors'
import type { PolkadotXCMTransferInput } from '../../types'
import { getNode } from '../../utils'
import type { ApiPromise } from '@polkadot/api'
import type { Extrinsic } from '../../pjs/types'

describe('transferPolkadotXCM', () => {
  it('throws ScenarioNotSupportedError for native KSM transfers in para to para scenarios', () => {
    const assetHub = getNode('AssetHubKusama')
    const input = {
      currencySymbol: 'KSM',
      currencyId: undefined,
      scenario: 'ParaToPara',
      destination: 'Karura'
    } as PolkadotXCMTransferInput<ApiPromise, Extrinsic>

    expect(() => assetHub.transferPolkadotXCM(input)).toThrow(ScenarioNotSupportedError)
  })

  it('throws ScenarioNotSupportedError for native DOT transfers in para to para scenarios', () => {
    const assetHub = getNode('AssetHubKusama')
    const input = {
      currencySymbol: 'DOT',
      currencyId: undefined,
      scenario: 'ParaToPara',
      destination: 'Karura'
    } as PolkadotXCMTransferInput<ApiPromise, Extrinsic>

    expect(() => assetHub.transferPolkadotXCM(input)).toThrow(ScenarioNotSupportedError)
  })
})

import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { getChain } from '../../utils'
import type BridgeHubPolkadot from './BridgeHubPolkadot'

vi.mock('../../pallets/polkadotXcm', () => ({
  transferPolkadotXcm: vi.fn()
}))

describe('BridgeHubPolkadot', () => {
  let chain: BridgeHubPolkadot<unknown, unknown>
  const mockInput = {
    scenario: 'RelayToPara',
    assetInfo: { symbol: 'DOT', amount: 100n }
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  beforeEach(() => {
    chain = getChain<unknown, unknown, 'BridgeHubPolkadot'>('BridgeHubPolkadot')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('BridgeHubPolkadot')
    expect(chain.info).toBe('polkadotBridgeHub')
    expect(chain.ecosystem).toBe('Polkadot')
    expect(chain.version).toBe(Version.V5)
  })

  it('throws for ParaToPara to a non-AssetHub dest', () => {
    const invalidInput = {
      ...mockInput,
      scenario: 'ParaToPara',
      destChain: 'Moonbeam'
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    expect(() => chain.transferPolkadotXCM(invalidInput)).toThrow(
      new ScenarioNotSupportedError(
        'Unable to use BridgeHubPolkadot for transfers to other Parachains.'
      )
    )
  })

  it('allows ParaToPara to an AssetHub dest and calls transferPolkadotXcm', async () => {
    const validInput = {
      ...mockInput,
      scenario: 'ParaToPara',
      destChain: 'AssetHubPolkadot'
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    await chain.transferPolkadotXCM(validInput)
    expect(transferPolkadotXcm).toHaveBeenCalledWith(
      validInput,
      'limited_teleport_assets',
      'Unlimited'
    )
  })

  it('should call transferPolkadotXCM with limitedTeleportAssets for non-ParaToPara scenario', async () => {
    await chain.transferPolkadotXCM(mockInput)
    expect(transferPolkadotXcm).toHaveBeenCalledWith(
      mockInput,
      'limited_teleport_assets',
      'Unlimited'
    )
  })

  it('should call getRelayToParaOverrides with the correct parameters', () => {
    const result = chain.getRelayToParaOverrides()
    expect(result).toEqual({
      transferType: 'teleport'
    })
  })
})

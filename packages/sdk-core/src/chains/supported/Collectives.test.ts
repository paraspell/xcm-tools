import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { getChain } from '../../utils/getChain'
import type Collectives from './Collectives'

vi.mock('../../pallets/polkadotXcm')

describe('Collectives', () => {
  let chain: Collectives<unknown, unknown>
  const mockInput = {
    scenario: 'RelayToPara',
    assetInfo: { symbol: 'DOT', amount: 100n }
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  beforeEach(() => {
    chain = getChain<unknown, unknown, 'Collectives'>('Collectives')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('Collectives')
    expect(chain.info).toBe('polkadotCollectives')
    expect(chain.ecosystem).toBe('Polkadot')
    expect(chain.version).toBe(Version.V5)
  })

  it('throws for ParaToPara to a non-AssetHub dest', () => {
    const invalidInput = {
      ...mockInput,
      scenario: 'ParaToPara',
      destChain: 'Moonbeam'
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    expect(() => chain.transferPolkadotXCM(invalidInput)).toThrowError(
      new ScenarioNotSupportedError(
        chain.chain,
        'ParaToPara',
        'Unable to use Collectives for transfers to other Parachains.'
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

  it('should return correct parameters for getRelayToParaOverrides', () => {
    const result = chain.getRelayToParaOverrides()
    expect(result).toEqual({ transferType: 'teleport' })
  })
})

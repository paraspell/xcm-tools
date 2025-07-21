import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { getNode } from '../../utils/getNode'
import type Collectives from './Collectives'

vi.mock('../../pallets/polkadotXcm', () => ({
  transferPolkadotXcm: vi.fn()
}))

describe('Collectives', () => {
  let node: Collectives<unknown, unknown>
  const mockInput = {
    scenario: 'RelayToPara',
    asset: { symbol: 'DOT', amount: 100n }
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  beforeEach(() => {
    node = getNode<unknown, unknown, 'Collectives'>('Collectives')
  })

  it('should initialize with correct values', () => {
    expect(node.node).toBe('Collectives')
    expect(node.info).toBe('polkadotCollectives')
    expect(node.type).toBe('polkadot')
    expect(node.version).toBe(Version.V4)
  })

  it('should throw ScenarioNotSupportedError for ParaToPara scenario', () => {
    const invalidInput = { ...mockInput, scenario: 'ParaToPara' } as TPolkadotXCMTransferOptions<
      unknown,
      unknown
    >

    expect(() => node.transferPolkadotXCM(invalidInput)).toThrowError(ScenarioNotSupportedError)
  })

  it('should call transferPolkadotXCM with limitedTeleportAssets for non-ParaToPara scenario', async () => {
    await node.transferPolkadotXCM(mockInput)
    expect(transferPolkadotXcm).toHaveBeenCalledWith(
      mockInput,
      'limited_teleport_assets',
      'Unlimited'
    )
  })

  it('should return correct parameters for getRelayToParaOverrides', () => {
    const result = node.getRelayToParaOverrides()
    expect(result).toEqual({ method: 'limited_teleport_assets', includeFee: true })
  })
})

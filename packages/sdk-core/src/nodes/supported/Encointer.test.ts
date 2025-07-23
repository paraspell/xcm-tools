import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ScenarioNotSupportedError } from '../../errors/ScenarioNotSupportedError'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { getNode } from '../../utils'
import type Encointer from './Encointer'

vi.mock('../../pallets/polkadotXcm', () => ({
  transferPolkadotXcm: vi.fn()
}))

describe('Encointer', () => {
  let node: Encointer<unknown, unknown>
  const mockInput = {
    scenario: 'ParaToRelay',
    asset: { symbol: 'KSM', amount: 100n }
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  beforeEach(() => {
    node = getNode<unknown, unknown, 'Encointer'>('Encointer')
  })

  it('should initialize with correct values', () => {
    expect(node.node).toBe('Encointer')
    expect(node.info).toBe('encointer')
    expect(node.type).toBe('kusama')
    expect(node.version).toBe(Version.V5)
  })

  it('should call transferPolkadotXCM with limitedTeleportAssets for ParaToRelay scenario', async () => {
    await node.transferPolkadotXCM(mockInput)
    expect(transferPolkadotXcm).toHaveBeenCalledWith(
      mockInput,
      'limited_teleport_assets',
      'Unlimited'
    )
  })

  it('should throw ScenarioNotSupportedError for unsupported scenario', () => {
    const invalidInput = { ...mockInput, scenario: 'ParaToPara' } as TPolkadotXCMTransferOptions<
      unknown,
      unknown
    >
    expect(() => node.transferPolkadotXCM(invalidInput)).toThrowError(
      new ScenarioNotSupportedError(node.node, 'ParaToPara')
    )
  })

  it('should call getRelayToParaOverrides with the correct parameters', () => {
    const result = node.getRelayToParaOverrides()
    expect(result).toEqual({
      method: 'limited_teleport_assets',
      includeFee: true
    })
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ScenarioNotSupportedError } from '../../errors/ScenarioNotSupportedError'
import PolkadotXCMTransferImpl from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { Version } from '../../types'
import { getNode } from '../../utils'
import type Encointer from './Encointer'

vi.mock('../../pallets/polkadotXcm', () => ({
  default: {
    transferPolkadotXCM: vi.fn()
  }
}))

describe('Encointer', () => {
  let node: Encointer<unknown, unknown>
  const mockInput = {
    scenario: 'ParaToRelay',
    asset: { symbol: 'KSM', amount: '100' }
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  beforeEach(() => {
    node = getNode<unknown, unknown, 'Encointer'>('Encointer')
  })

  it('should initialize with correct values', () => {
    expect(node.node).toBe('Encointer')
    expect(node.info).toBe('encointer')
    expect(node.type).toBe('kusama')
    expect(node.version).toBe(Version.V3)
  })

  it('should call transferPolkadotXCM with limitedTeleportAssets for ParaToRelay scenario', async () => {
    const spy = vi.spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')

    await node.transferPolkadotXCM(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, 'limited_teleport_assets', 'Unlimited')
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
      section: 'limited_teleport_assets',
      includeFee: true
    })
  })
})

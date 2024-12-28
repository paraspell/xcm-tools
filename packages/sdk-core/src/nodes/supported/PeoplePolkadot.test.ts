import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { getNode } from '../../utils'
import PolkadotXCMTransferImpl from '../../pallets/polkadotXcm'
import PeoplePolkadot from './PeoplePolkadot'
import { ScenarioNotSupportedError } from '../../errors'

vi.mock('../../pallets/polkadotXcm', async () => {
  const actual = await vi.importActual<typeof import('../../pallets/polkadotXcm')>(
    '../../pallets/polkadotXcm'
  )
  return {
    default: {
      ...actual.default,
      transferPolkadotXCM: vi.fn()
    }
  }
})

describe('PeoplePolkadot', () => {
  let node: PeoplePolkadot<unknown, unknown>

  beforeEach(() => {
    node = getNode<unknown, unknown, 'PeoplePolkadot'>('PeoplePolkadot')
  })

  it('should be instantiated correctly', () => {
    expect(node).toBeInstanceOf(PeoplePolkadot)
  })

  describe('transferPolkadotXCM', () => {
    it('should throw an error when scenario is ParaToPara', () => {
      const input = { scenario: 'ParaToPara' } as TPolkadotXCMTransferOptions<unknown, unknown>

      expect(() => node.transferPolkadotXCM(input)).toThrowError(ScenarioNotSupportedError)
    })

    it('should use limitedTeleportAssets when scenario is not ParaToPara', async () => {
      const input = { scenario: 'ParaToRelay' } as TPolkadotXCMTransferOptions<unknown, unknown>

      const spy = vi.spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')

      await node.transferPolkadotXCM(input)
      expect(spy).toHaveBeenCalledWith(input, 'limited_teleport_assets', 'Unlimited')
    })
  })

  it('should call getRelayToParaOverrides with the correct parameters', () => {
    const result = node.getRelayToParaOverrides()
    expect(result).toEqual({
      section: 'limited_teleport_assets',
      includeFee: true
    })
  })
})

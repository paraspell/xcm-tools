import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { getNode } from '../../utils'
import PolkadotXCMTransferImpl from '../polkadotXcm'
import PeopleKusama from './PeopleKusama'
import type { ApiPromise } from '@polkadot/api'
import type { Extrinsic } from '../../pjs/types'
import { ScenarioNotSupportedError } from '../../errors'

vi.mock('../polkadotXcm', async () => {
  const actual = await vi.importActual<typeof import('../polkadotXcm')>('../polkadotXcm')
  return {
    default: {
      ...actual.default,
      transferPolkadotXCM: vi.fn()
    }
  }
})

describe('PeopleKusama', () => {
  let node: PeopleKusama<ApiPromise, Extrinsic>

  beforeEach(() => {
    node = getNode<ApiPromise, Extrinsic, 'PeopleKusama'>('PeopleKusama')
  })

  it('should be instantiated correctly', () => {
    expect(node).toBeInstanceOf(PeopleKusama)
  })

  describe('transferPolkadotXCM', () => {
    it('should throw an error when scenario is ParaToPara', () => {
      const input = { scenario: 'ParaToPara' } as TPolkadotXCMTransferOptions<ApiPromise, Extrinsic>

      expect(() => node.transferPolkadotXCM(input)).toThrowError(ScenarioNotSupportedError)
    })

    it('should use limitedTeleportAssets when scenario is not ParaToPara', async () => {
      const input = { scenario: 'ParaToRelay' } as TPolkadotXCMTransferOptions<
        ApiPromise,
        Extrinsic
      >

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

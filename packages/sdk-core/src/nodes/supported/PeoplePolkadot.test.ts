import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { getNode } from '../../utils'
import PeoplePolkadot from './PeoplePolkadot'

vi.mock('../../pallets/polkadotXcm', () => ({
  transferPolkadotXcm: vi.fn()
}))

describe('PeoplePolkadot', () => {
  let node: PeoplePolkadot<unknown, unknown>

  beforeEach(() => {
    node = getNode<unknown, unknown, 'PeoplePolkadot'>('PeoplePolkadot')
  })

  it('should initialize with correct values', () => {
    expect(node).toBeInstanceOf(PeoplePolkadot)
    expect(node.node).toBe('PeoplePolkadot')
    expect(node.info).toBe('polkadotPeople')
    expect(node.type).toBe('polkadot')
    expect(node.version).toBe(Version.V4)
  })

  describe('transferPolkadotXCM', () => {
    it('should throw an error when scenario is ParaToPara', () => {
      const input = { scenario: 'ParaToPara' } as TPolkadotXCMTransferOptions<unknown, unknown>

      expect(() => node.transferPolkadotXCM(input)).toThrowError(ScenarioNotSupportedError)
    })

    it('should use limitedTeleportAssets when scenario is not ParaToPara', async () => {
      const input = { scenario: 'ParaToRelay' } as TPolkadotXCMTransferOptions<unknown, unknown>
      await node.transferPolkadotXCM(input)
      expect(transferPolkadotXcm).toHaveBeenCalledWith(
        input,
        'limited_teleport_assets',
        'Unlimited'
      )
    })
  })

  it('should call getRelayToParaOverrides with the correct parameters', () => {
    const result = node.getRelayToParaOverrides()
    expect(result).toEqual({
      method: 'limited_teleport_assets',
      includeFee: true
    })
  })
})

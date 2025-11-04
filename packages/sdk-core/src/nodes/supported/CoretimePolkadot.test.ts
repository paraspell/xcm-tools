import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { InvalidParameterError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions, TScenario, TSendInternalOptions } from '../../types'
import { getNode } from '../../utils'
import CoretimePolkadot from './CoretimePolkadot'

vi.mock('../../pallets/polkadotXcm', () => ({
  transferPolkadotXcm: vi.fn()
}))

describe('CoretimePolkadot', () => {
  let node: CoretimePolkadot<unknown, unknown>

  beforeEach(() => {
    node = getNode<unknown, unknown, 'CoretimePolkadot'>('CoretimePolkadot')
  })

  it('should initialize with correct values', () => {
    expect(node).toBeInstanceOf(CoretimePolkadot)
    expect(node.node).toBe('CoretimePolkadot')
    expect(node.info).toBe('polkadotCoretime')
    expect(node.type).toBe('polkadot')
    expect(node.version).toBe(Version.V5)
  })

  describe('transferPolkadotXCM', () => {
    it('should use limitedReserveTransferAssets when scenario is ParaToPara', async () => {
      const input = { scenario: 'ParaToPara' } as TPolkadotXCMTransferOptions<unknown, unknown>

      await node.transferPolkadotXCM(input)

      expect(transferPolkadotXcm).toHaveBeenCalledWith(
        input,
        'limited_reserve_transfer_assets',
        'Unlimited'
      )
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

  describe('temporary disable flags', () => {
    const emptyOptions = {} as TSendInternalOptions<unknown, unknown>

    it('should mark sending and receiving as temporarily disabled', () => {
      expect(node.isSendingTempDisabled(emptyOptions)).toBe(true)
      expect(node.isReceivingTempDisabled('ParaToPara' as TScenario)).toBe(true)
    })

    it('should throw when attempting local transfer', () => {
      const invokeTransferLocal = () => node.transferLocal(emptyOptions)

      expect(invokeTransferLocal).toThrow(InvalidParameterError)
      expect(invokeTransferLocal).toThrow(
        'Local transfers on CoretimePolkadot are temporarily disabled.'
      )
    })
  })
})

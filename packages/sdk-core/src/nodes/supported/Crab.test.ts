import { Parents, Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { NodeNotSupportedError, ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { getNode } from '../../utils'
import { createMultiAsset } from '../../utils/multiAsset'
import type Crab from './Crab'

vi.mock('../../pallets/polkadotXcm', () => ({
  transferPolkadotXcm: vi.fn()
}))

vi.mock('../../utils/multiAsset', () => ({
  createMultiAsset: vi.fn()
}))

describe('Crab', () => {
  let crab: Crab<unknown, unknown>
  const mockInput = {
    scenario: 'ParaToPara',
    asset: { symbol: 'KSM', amount: '100' }
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  beforeEach(() => {
    crab = getNode<unknown, unknown, 'Crab'>('Crab')
  })

  it('should initialize with correct values', () => {
    expect(crab.node).toBe('Crab')
    expect(crab.info).toBe('crab')
    expect(crab.type).toBe('kusama')
    expect(crab.version).toBe(Version.V4)
  })

  it('should throw ScenarioNotSupportedError for ParaToRelay scenario', () => {
    const invalidInput = { ...mockInput, scenario: 'ParaToRelay' } as TPolkadotXCMTransferOptions<
      unknown,
      unknown
    >

    expect(() => crab.transferPolkadotXCM(invalidInput)).toThrowError(ScenarioNotSupportedError)
  })

  it('should call transferPolkadotXCM with reserve_transfer_assets for non-ParaToPara scenario', async () => {
    await crab.transferPolkadotXCM(mockInput)
    expect(transferPolkadotXcm).toHaveBeenCalledWith(mockInput, 'reserve_transfer_assets')
  })

  it('should throw NodeNotSupportedError when calling transferRelayToPara', () => {
    expect(() => crab.transferRelayToPara()).toThrowError(NodeNotSupportedError)
  })

  it('should call createCurrencySpec with correct values', () => {
    crab.createCurrencySpec('100', 'ParaToPara', Version.V4)
    expect(createMultiAsset).toHaveBeenCalledWith(Version.V4, '100', {
      parents: Parents.ZERO,
      interior: {
        X1: {
          PalletInstance: 5
        }
      }
    })
  })

  it('should call createCurrencySpec with correct values - ParaToRelay', () => {
    crab.createCurrencySpec('100', 'ParaToRelay', Version.V4)
    expect(createMultiAsset).toHaveBeenCalledWith(Version.V4, '100', {
      parents: Parents.ZERO,
      interior: {
        X1: {
          PalletInstance: 5
        }
      }
    })
  })
})

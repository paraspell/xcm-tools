import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NodeNotSupportedError, ScenarioNotSupportedError } from '../../errors'
import type { PolkadotXCMTransferInput } from '../../types'
import { Parents, Version } from '../../types'
import PolkadotXCMTransferImpl from '../polkadotXcm'
import { getNode } from '../../utils'
import type { ApiPromise } from '@polkadot/api'
import type { Extrinsic } from '../../pjs/types'
import type Crab from './Crab'
import { createCurrencySpec } from '../../pallets/xcmPallet/utils'

vi.mock('../polkadotXcm', () => ({
  default: {
    transferPolkadotXCM: vi.fn()
  }
}))

vi.mock('../../pallets/xcmPallet/utils', () => ({
  createCurrencySpec: vi.fn()
}))

describe('Crab', () => {
  let crab: Crab<ApiPromise, Extrinsic>
  const mockInput = {
    scenario: 'ParaToPara',
    asset: { symbol: 'KSM' },
    amount: '100'
  } as PolkadotXCMTransferInput<ApiPromise, Extrinsic>

  beforeEach(() => {
    crab = getNode<ApiPromise, Extrinsic, 'Crab'>('Crab')
  })

  it('should initialize with correct values', () => {
    expect(crab.node).toBe('Crab')
    expect(crab.name).toBe('crab')
    expect(crab.type).toBe('kusama')
    expect(crab.version).toBe(Version.V3)
  })

  it('should throw ScenarioNotSupportedError for ParaToRelay scenario', () => {
    const invalidInput = { ...mockInput, scenario: 'ParaToRelay' } as PolkadotXCMTransferInput<
      ApiPromise,
      Extrinsic
    >

    expect(() => crab.transferPolkadotXCM(invalidInput)).toThrowError(ScenarioNotSupportedError)
  })

  it('should call transferPolkadotXCM with reserve_transfer_assets for non-ParaToPara scenario', async () => {
    const spy = vi.spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')

    await crab.transferPolkadotXCM(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, 'reserve_transfer_assets')
  })

  it('should throw NodeNotSupportedError when calling transferRelayToPara', () => {
    expect(() => crab.transferRelayToPara()).toThrowError(NodeNotSupportedError)
  })

  it('should call createCurrencySpec with correct values', () => {
    crab.createCurrencySpec('100', 'ParaToPara', Version.V3)
    expect(createCurrencySpec).toHaveBeenCalledWith('100', Version.V3, Parents.ZERO, undefined, {
      X1: {
        PalletInstance: 5
      }
    })
  })
})

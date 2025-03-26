import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ScenarioNotSupportedError } from '../../errors'
import PolkadotXCMTransferImpl from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { Version } from '../../types'
import { getNode } from '../../utils'
import type Darwinia from './Darwinia'

vi.mock('../../pallets/polkadotXcm', () => ({
  default: {
    transferPolkadotXCM: vi.fn()
  }
}))

describe('Darwinia', () => {
  let darwinia: Darwinia<unknown, unknown>

  const mockPolkadotXCMInput = {
    scenario: 'ParaToRelay',
    asset: { symbol: 'DOT', amount: '100' }
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  beforeEach(() => {
    darwinia = getNode<unknown, unknown, 'Darwinia'>('Darwinia')
  })

  it('should initialize with correct values', () => {
    expect(darwinia.node).toBe('Darwinia')
    expect(darwinia.info).toBe('darwinia')
    expect(darwinia.type).toBe('polkadot')
    expect(darwinia.version).toBe(Version.V3)
  })

  it('should call transferPolkadotXCM with reserveTransferAssets for ParaToRelay scenario', async () => {
    const spy = vi.spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')

    await darwinia.transferPolkadotXCM(mockPolkadotXCMInput)

    expect(spy).toHaveBeenCalledWith(mockPolkadotXCMInput, 'reserve_transfer_assets')
  })

  it('should throw error for ParaToPara scenario', () => {
    const input = {
      ...mockPolkadotXCMInput,
      scenario: 'ParaToPara'
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    expect(() => darwinia.transferPolkadotXCM(input)).toThrow(ScenarioNotSupportedError)
  })
})

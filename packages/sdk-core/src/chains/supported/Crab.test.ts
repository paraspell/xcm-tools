import { Parents, Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ChainNotSupportedError, ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { getChain } from '../../utils'
import { createAsset } from '../../utils/asset'
import type Crab from './Crab'

vi.mock('../../pallets/polkadotXcm', () => ({
  transferPolkadotXcm: vi.fn()
}))

vi.mock('../../utils/asset', () => ({
  createAsset: vi.fn()
}))

describe('Crab', () => {
  let crab: Crab<unknown, unknown>
  const mockInput = {
    scenario: 'ParaToPara',
    assetInfo: { symbol: 'KSM', amount: 100n }
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  beforeEach(() => {
    crab = getChain<unknown, unknown, 'Crab'>('Crab')
  })

  it('should initialize with correct values', () => {
    expect(crab.chain).toBe('Crab')
    expect(crab.info).toBe('crab')
    expect(crab.ecosystem).toBe('Kusama')
    expect(crab.version).toBe(Version.V4)
  })

  it('should throw ScenarioNotSupportedError for ParaToRelay scenario', () => {
    const invalidInput = { ...mockInput, scenario: 'ParaToRelay' } as TPolkadotXCMTransferOptions<
      unknown,
      unknown
    >

    expect(() => crab.transferPolkadotXCM(invalidInput)).toThrowError(ScenarioNotSupportedError)
  })

  it('should call transferPolkadotXCM with limited_reserve_transfer_assets for non-ParaToPara scenario', async () => {
    await crab.transferPolkadotXCM(mockInput)
    expect(transferPolkadotXcm).toHaveBeenCalledWith(
      mockInput,
      'limited_reserve_transfer_assets',
      'Unlimited'
    )
  })

  it('should throw ChainNotSupportedError when calling transferRelayToPara', () => {
    expect(() => crab.transferRelayToPara()).toThrowError(ChainNotSupportedError)
  })

  it('should call createCurrencySpec with correct values', () => {
    crab.createCurrencySpec(100n, 'ParaToPara', Version.V4)
    expect(createAsset).toHaveBeenCalledWith(Version.V4, 100n, {
      parents: Parents.ZERO,
      interior: {
        X1: [
          {
            PalletInstance: 5
          }
        ]
      }
    })
  })

  it('should call createCurrencySpec with correct values - ParaToRelay', () => {
    crab.createCurrencySpec(100n, 'ParaToRelay', Version.V4)
    expect(createAsset).toHaveBeenCalledWith(Version.V4, 100n, {
      parents: Parents.ZERO,
      interior: {
        X1: [
          {
            PalletInstance: 5
          }
        ]
      }
    })
  })
})

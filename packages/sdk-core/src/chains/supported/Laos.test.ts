import { InvalidCurrencyError } from '@paraspell/assets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ScenarioNotSupportedError, TransferToAhNotSupported } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { getChain } from '../../utils'
import Laos from './Laos'

vi.mock('../../pallets/polkadotXcm')

describe('Laos', () => {
  let chain: Laos<unknown, unknown>

  beforeEach(() => {
    chain = getChain<unknown, unknown, 'Laos'>('Laos')
  })

  it('should be instantiated correctly', () => {
    expect(chain).toBeInstanceOf(Laos)
  })

  it('should not suppoert ParaToRelay scenario', () => {
    const input = { scenario: 'ParaToRelay' } as TPolkadotXCMTransferOptions<unknown, unknown>
    expect(() => chain.transferPolkadotXCM(input)).toThrow(ScenarioNotSupportedError)
  })

  it('should only support native currency', () => {
    const input = {
      scenario: 'ParaToPara',
      assetInfo: { symbol: 'XYZ' }
    } as TPolkadotXCMTransferOptions<unknown, unknown>
    expect(() => chain.transferPolkadotXCM(input)).toThrow(InvalidCurrencyError)
  })

  it('should use limitedReserveTransferAssets when scenario is ParaToPara', async () => {
    const input = {
      scenario: 'ParaToPara',
      assetInfo: { symbol: 'LAOS' }
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    await chain.transferPolkadotXCM(input)
    expect(transferPolkadotXcm).toHaveBeenCalledWith(input)
  })

  it('should not support transfer to AssetHubPolkadot', () => {
    const input = {
      scenario: 'ParaToPara',
      assetInfo: { symbol: 'LAOS' },
      destination: 'AssetHubPolkadot'
    } as TPolkadotXCMTransferOptions<unknown, unknown>
    expect(() => chain.transferPolkadotXCM(input)).toThrow(TransferToAhNotSupported)
  })

  it('should return false for isRelayToParaEnabled', () => {
    expect(chain.isRelayToParaEnabled()).toBe(false)
  })
})

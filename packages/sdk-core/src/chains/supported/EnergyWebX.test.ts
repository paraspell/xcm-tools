vi.mock('../../pallets')
vi.mock('../../pallets/polkadotXcm')

import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi, TAssetInfo } from '../../../dist'
import { ScenarioNotSupportedError } from '../../errors'
import { getPalletInstance } from '../../pallets'
import type { AssetsPallet } from '../../pallets/assets'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { getChain } from '../../utils/getChain'
import type EnergyWebX from './EnergyWebX'

describe('EnergyWebX', () => {
  let chain: EnergyWebX<unknown, unknown>

  beforeEach(() => {
    chain = getChain<unknown, unknown, 'EnergyWebX'>('EnergyWebX')
    vi.clearAllMocks()
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('EnergyWebX')
    expect(chain.info).toBe('ewx')
    expect(chain.ecosystem).toBe('Polkadot')
    expect(chain.version).toBe(Version.V3)
  })

  it('should handle ParaToPara transfers correctly', async () => {
    const input = {
      scenario: 'ParaToPara',
      assetInfo: { symbol: 'DOT', amount: 100n }
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    await chain.transferPolkadotXCM(input)

    expect(transferPolkadotXcm).toHaveBeenCalledWith(
      input,
      'limited_reserve_transfer_assets',
      'Unlimited'
    )
  })

  it('should throw ScenarioNotSupportedError for non-ParaToPara scenarios', () => {
    const scenarios = ['RelayToPara', 'ParaToRelay'] as const

    scenarios.forEach(scenario => {
      const input = {
        scenario,
        assetInfo: { symbol: 'DOT', amount: 100n }
      } as TPolkadotXCMTransferOptions<unknown, unknown>

      expect(() => chain.transferPolkadotXCM(input)).toThrow(ScenarioNotSupportedError)
    })
  })

  it('should throw ScenarioNotSupportedError for transferRelayToPara', () => {
    expect(() => chain.transferRelayToPara()).toThrow(ScenarioNotSupportedError)
  })

  describe('getBalance', () => {
    it('should return asset balance using Assets pallet', async () => {
      const mockBalance = 123n
      const mockApi = {
        queryState: vi.fn().mockResolvedValue({ balance: 777n })
      } as unknown as IPolkadotApi<unknown, unknown>

      const mockAddress = '5FTestAddress'
      const mockAsset = { symbol: 'EWX', assetId: '1' } as unknown as TAssetInfo

      const getBalanceMock = vi.fn().mockResolvedValue(123n)

      vi.mocked(getPalletInstance).mockReturnValue({
        getBalance: getBalanceMock
      } as unknown as AssetsPallet)

      const result = await chain.getBalance(mockApi, mockAddress, mockAsset)

      expect(getPalletInstance).toHaveBeenCalledWith('Assets')
      expect(getBalanceMock).toHaveBeenCalledWith(mockApi, mockAddress, mockAsset, chain.chain)
      expect(result).toBe(mockBalance)
    })
  })
})

import type { TAssetInfo } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions, TTransferLocalOptions } from '../../types'
import { getChain } from '../../utils/getChain'
import type EnergyWebX from './EnergyWebX'

vi.mock('../../pallets')
vi.mock('../../pallets/polkadotXcm')

describe('EnergyWebX', () => {
  let chain: EnergyWebX<unknown, unknown, unknown>

  beforeEach(() => {
    chain = getChain<unknown, unknown, unknown, 'EnergyWebX'>('EnergyWebX')
    vi.clearAllMocks()
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('EnergyWebX')
    expect(chain.info).toBe('ewx')
    expect(chain.ecosystem).toBe('Polkadot')
    expect(chain.version).toBe(Version.V5)
  })

  it('uses the asset location as id for minting', () => {
    const api = { isChainEvm: () => false } as unknown as PolkadotApi<unknown, unknown, unknown>
    expect(chain.resolveMintConfig(api)).toMatchObject({ useLocationId: true })
  })

  it('should use reserve transfer', () => {
    expect(chain['shouldUseReserveTransfer']()).toBe(true)
  })

  it('should handle ParaToPara transfers correctly', async () => {
    const input = {
      scenario: 'ParaToPara',
      assetInfo: { symbol: 'DOT', amount: 100n }
    } as TPolkadotXCMTransferOptions<unknown, unknown, unknown>

    await chain.transferPolkadotXCM(input)

    expect(transferPolkadotXcm).toHaveBeenCalledWith(input, 'reserve_transfer_assets')
  })

  it('should throw ScenarioNotSupportedError for non-ParaToPara scenarios', () => {
    const scenarios = ['RelayToPara', 'ParaToRelay'] as const

    scenarios.forEach(scenario => {
      const input = {
        scenario,
        assetInfo: { symbol: 'DOT', amount: 100n }
      } as TPolkadotXCMTransferOptions<unknown, unknown, unknown>

      expect(() => chain.transferPolkadotXCM(input)).toThrow(ScenarioNotSupportedError)
    })
  })

  it('should return false for isRelayToParaEnabled', () => {
    expect(chain.isRelayToParaEnabled()).toBe(false)
  })

  it('should query balance foreign with localized asset location and address', async () => {
    const queryState = vi.fn().mockResolvedValue({ balance: 321n })
    const localizedLocation = { parents: 0, interior: { X1: [{ GeneralIndex: 1 }] } }
    const localizeLocation = vi.fn().mockReturnValue(localizedLocation)

    const api = { queryState, localizeLocation } as unknown as PolkadotApi<
      unknown,
      unknown,
      unknown
    >
    const asset = {
      location: { parents: 1, interior: { X2: [{ Parachain: 3345 }, { GeneralIndex: 1 }] } }
    } as TAssetInfo
    const address = '5FbalanceAddr'

    const balance = await chain.getBalanceForeign(api, address, asset)

    expect(localizeLocation).toHaveBeenCalledWith('EnergyWebX', asset.location)
    expect(queryState).toHaveBeenCalledWith({
      module: 'Assets',
      method: 'Account',
      params: [localizedLocation, address]
    })
    expect(balance).toBe(321n)
  })

  describe('transferLocalNonNativeAsset', () => {
    const location = {
      parents: 1,
      interior: { X3: [{ Parachain: 3345 }, { PalletInstance: 60 }, { GeneralIndex: 1 }] }
    }
    const localizedLocation = {
      parents: 0,
      interior: { X2: [{ PalletInstance: 60 }, { GeneralIndex: 1 }] }
    }

    const mockApi = {
      deserializeExtrinsics: vi.fn(),
      localizeLocation: vi.fn()
    } as unknown as PolkadotApi<unknown, unknown, unknown>

    beforeEach(() => {
      vi.spyOn(mockApi, 'localizeLocation').mockReturnValue(localizedLocation)
    })

    it.each([
      [true, 'transfer_keep_alive'],
      [false, 'transfer']
    ])(
      'should call Assets transfer with localized location (keepAlive: %s)',
      (keepAlive, method) => {
        const options = {
          api: mockApi,
          assetInfo: { symbol: 'stEWT', amount: 100n, location },
          recipient: 'address',
          keepAlive
        } as TTransferLocalOptions<unknown, unknown, unknown>

        const localizeSpy = vi.spyOn(mockApi, 'localizeLocation')
        const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

        chain.transferLocalNonNativeAsset(options)

        expect(localizeSpy).toHaveBeenCalledWith('EnergyWebX', location)
        expect(spy).toHaveBeenCalledWith({
          module: 'Assets',
          method,
          params: {
            id: localizedLocation,
            target: { Id: 'address' },
            amount: 100n
          }
        })
      }
    )

    it('should call Assets transfer_all when amount is ALL', () => {
      const options = {
        api: mockApi,
        assetInfo: { symbol: 'stEWT', amount: 100n, location },
        recipient: 'address',
        isAmountAll: true,
        keepAlive: false
      } as TTransferLocalOptions<unknown, unknown, unknown>

      const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

      chain.transferLocalNonNativeAsset(options)

      expect(spy).toHaveBeenCalledWith({
        module: 'Assets',
        method: 'transfer_all',
        params: {
          id: localizedLocation,
          dest: { Id: 'address' },
          keep_alive: false
        }
      })
    })
  })
})

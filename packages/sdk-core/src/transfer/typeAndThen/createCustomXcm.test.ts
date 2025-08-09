import type { TMultiLocation } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { MIN_FEE, RELAY_LOCATION } from '../../constants'
import type { TChainWithApi, TTypeAndThenCallContext } from '../../types'
import { createBeneficiaryLocation } from '../../utils'
import { createCustomXcm } from './createCustomXcm'

vi.mock('../../pallets/xcmPallet/utils', () => ({
  createDestination: vi.fn((version, chain, destination, paraIdTo) => ({
    mockDestination: { version, chain, destination, paraIdTo }
  }))
}))

vi.mock('../../utils', () => ({
  createBeneficiaryLocation: vi.fn(),
  createMultiAsset: vi.fn((_version, amount, location) => ({
    id: location,
    fun: { Fungible: amount }
  })),
  localizeLocation: vi.fn((chain, location) => ({
    localizedLocation: { chain, location }
  }))
}))

describe('createCustomXcm', () => {
  const mockApi = {} as IPolkadotApi<unknown, unknown>
  const mockAddress = '0x123'
  const mockVersion = Version.V3

  const mockContext = {
    origin: { chain: 'AssetHubPolkadot', api: mockApi } as TChainWithApi<unknown, unknown>,
    dest: { chain: 'Acala' } as TChainWithApi<unknown, unknown>,
    reserve: { chain: 'AssetHubPolkadot', api: mockApi } as TChainWithApi<unknown, unknown>,
    asset: { amount: 1000000n, multiLocation: RELAY_LOCATION },
    options: {
      destination: 'Acala',
      version: mockVersion,
      address: mockAddress
    }
  } as TTypeAndThenCallContext<unknown, unknown>

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createBeneficiaryLocation).mockImplementation(
      ({ api, address, version }) =>
        ({
          mockBeneficiary: { api, address, version }
        }) as unknown as TMultiLocation
    )
  })

  describe('DepositReserveAsset (different chains)', () => {
    it('uses Wild: All assets when destFee equals MIN_FEE', () => {
      const origin = { chain: 'AssetHubPolkadot', api: mockApi } as TChainWithApi<unknown, unknown>
      const dest = { chain: 'Kusama' } as TChainWithApi<unknown, unknown>
      const reserve = { chain: 'Hydration' } as TChainWithApi<unknown, unknown>

      const result = createCustomXcm(
        {
          ...mockContext,
          origin,
          dest,
          reserve
        },
        true,
        {
          reserveFee: MIN_FEE,
          refundFee: 0n,
          destFee: MIN_FEE
        }
      )

      expect(result).toHaveProperty('DepositReserveAsset')
      expect(result).not.toHaveProperty('DepositAsset')

      if ('DepositReserveAsset' in result) {
        expect(result.DepositReserveAsset.assets).toEqual({ Wild: 'All' })
        expect(result.DepositReserveAsset).toHaveProperty('dest')
        expect(result.DepositReserveAsset.xcm).toHaveLength(2)
        expect(result.DepositReserveAsset.xcm[0]).toHaveProperty('BuyExecution')
        expect(result.DepositReserveAsset.xcm[1]).toHaveProperty('DepositAsset')
      }
    })

    it('uses Definite assets when destFee is not MIN_FEE', () => {
      const origin = { chain: 'AssetHubPolkadot', api: mockApi } as TChainWithApi<unknown, unknown>
      const dest = { chain: 'Hydration' } as TChainWithApi<unknown, unknown>
      const reserve = { chain: 'Acala' } as TChainWithApi<unknown, unknown>

      const result = createCustomXcm(
        {
          ...mockContext,
          origin,
          dest,
          reserve
        },
        false,
        {
          reserveFee: 100n,
          refundFee: 50n,
          destFee: 200n
        }
      )

      expect(result).toHaveProperty('DepositReserveAsset')

      if ('DepositReserveAsset' in result) {
        expect(result.DepositReserveAsset.assets).toHaveProperty('Definite')
        const definiteAssets = result.DepositReserveAsset.assets.Definite
        expect(definiteAssets).toHaveLength(2)
        expect(definiteAssets?.[0].fun).toEqual({ Fungible: 300n }) // reserveFee + refundFee
        expect(definiteAssets?.[1].fun).toEqual({ Fungible: 1000000n })
      }
    })

    it('excludes DOT from assetsFilter when asset location equals RELAY_LOCATION', () => {
      const result = createCustomXcm(mockContext, true, {
        reserveFee: 100n,
        refundFee: 50n,
        destFee: 200n
      })

      if ('DepositReserveAsset' in result) {
        expect(result.DepositReserveAsset.assets.Definite).toHaveLength(1)
        expect(result.DepositReserveAsset.assets.Definite?.[0].fun).toEqual({ Fungible: 1000000n })
      }
    })

    it('calculates BuyExecution fees correctly with DOT included', () => {
      const result = createCustomXcm(mockContext, false, {
        reserveFee: 100n,
        refundFee: 50n,
        destFee: 200n
      })

      if ('DepositReserveAsset' in result && 'BuyExecution' in result.DepositReserveAsset.xcm[0]) {
        const buyExecution = result.DepositReserveAsset.xcm[0].BuyExecution
        expect(buyExecution.fees.fun.Fungible).toBe(200n)
        expect(buyExecution.fees.id).toEqual(RELAY_LOCATION)
        expect(buyExecution.weight_limit).toBe('Unlimited')
      }
    })

    it('calculates BuyExecution fees correctly without DOT', () => {
      const result = createCustomXcm(mockContext, false, {
        reserveFee: 100n,
        refundFee: 50n,
        destFee: 200n
      })

      if ('DepositReserveAsset' in result && 'BuyExecution' in result.DepositReserveAsset.xcm[0]) {
        const buyExecution = result.DepositReserveAsset.xcm[0].BuyExecution
        expect(buyExecution.fees.fun.Fungible).toBe(999850n) // amount - refundFee - destFee
        expect(buyExecution.fees.id).toEqual(RELAY_LOCATION)
      }
    })

    it('uses default fees when fees parameter not provided', () => {
      const result = createCustomXcm(mockContext, false)

      if ('DepositReserveAsset' in result) {
        expect(result.DepositReserveAsset.assets).toEqual({ Wild: 'All' })

        if ('BuyExecution' in result.DepositReserveAsset.xcm[0]) {
          expect(result.DepositReserveAsset.xcm[0].BuyExecution.fees.fun.Fungible).toBe(MIN_FEE)
        }
      }
    })
  })

  describe('DepositAsset (same chain scenarios)', () => {
    it('returns DepositAsset when chain equals reserveChain', () => {
      const origin = { chain: 'AssetHubPolkadot' } as TChainWithApi<unknown, unknown>
      const dest = { chain: 'Acala' } as TChainWithApi<unknown, unknown>
      const reserve = { chain: 'AssetHubPolkadot' } as TChainWithApi<unknown, unknown>

      const result = createCustomXcm(
        {
          ...mockContext,
          origin,
          dest,
          reserve
        },
        false
      )

      expect(result).toHaveProperty('DepositAsset')
      expect(result).not.toHaveProperty('DepositReserveAsset')

      if ('DepositAsset' in result) {
        expect(result.DepositAsset.assets).toHaveProperty('Wild')
        expect(result.DepositAsset.assets.Wild).toHaveProperty('AllOf')
        expect(result.DepositAsset.assets.Wild.AllOf).toHaveProperty('id')
        expect(result.DepositAsset.assets.Wild.AllOf).toHaveProperty('fun', 'Fungible')
        expect(result.DepositAsset).toHaveProperty('beneficiary')
      }
    })

    it('returns DepositAsset when destChain equals reserveChain', () => {
      const origin = { chain: 'Polkadot', api: mockApi } as TChainWithApi<unknown, unknown>
      const dest = { chain: 'AssetHubPolkadot' } as TChainWithApi<unknown, unknown>
      const reserve = { chain: 'AssetHubPolkadot' } as TChainWithApi<unknown, unknown>

      const result = createCustomXcm(
        {
          ...mockContext,
          origin,
          dest,
          reserve
        },
        false
      )

      expect(result).toHaveProperty('DepositAsset')
      expect(result).not.toHaveProperty('DepositReserveAsset')

      if ('DepositAsset' in result) {
        expect(result.DepositAsset.beneficiary).toEqual({
          mockBeneficiary: {
            api: mockApi,
            address: mockAddress,
            version: mockVersion
          }
        })
      }
    })

    it('returns DepositAsset when both chain and destChain equal reserveChain', () => {
      const origin = { chain: 'AssetHubPolkadot' } as TChainWithApi<unknown, unknown>
      const dest = { chain: 'AssetHubPolkadot' } as TChainWithApi<unknown, unknown>
      const reserve = { chain: 'AssetHubPolkadot' } as TChainWithApi<unknown, unknown>

      const result = createCustomXcm(
        {
          ...mockContext,
          origin,
          dest,
          reserve
        },
        false
      )

      expect(result).toHaveProperty('DepositAsset')
      expect(result).not.toHaveProperty('DepositReserveAsset')
    })
  })
})

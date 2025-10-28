import type { TAssetWithLocation, WithAmount } from '@paraspell/assets'
import type { TLocation } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'
import * as sdkCommon from '@paraspell/sdk-common'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { RELAY_LOCATION } from '../../constants'
import { AmountTooLowError } from '../../errors'
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
  createAsset: vi.fn((_version, amount, location) => ({
    id: location,
    fun: { Fungible: amount }
  })),
  localizeLocation: vi.fn((chain, location) => ({
    localizedLocation: { chain, location }
  })),
  normalizeAmount: vi.fn((amount: bigint) => amount)
}))

describe('createCustomXcm', () => {
  type TCustomXcmResult = ReturnType<typeof createCustomXcm>
  type DepositReserveInstruction = Extract<
    TCustomXcmResult[number],
    { DepositReserveAsset: unknown }
  >
  type InitiateTeleportInstruction = Extract<
    TCustomXcmResult[number],
    { InitiateTeleport: unknown }
  >
  type DepositAssetInstruction = Extract<TCustomXcmResult[number], { DepositAsset: unknown }>
  type ReserveInstructionStep = DepositReserveInstruction['DepositReserveAsset']['xcm'][number]
  type BuyExecutionStep = Extract<ReserveInstructionStep, { BuyExecution: unknown }>

  const getDepositReserveInstruction = (
    result: TCustomXcmResult
  ): DepositReserveInstruction | undefined =>
    result.find(
      (instruction): instruction is DepositReserveInstruction =>
        typeof instruction === 'object' &&
        instruction !== null &&
        'DepositReserveAsset' in instruction
    )

  const getInitiateTeleportInstruction = (
    result: TCustomXcmResult
  ): InitiateTeleportInstruction | undefined =>
    result.find(
      (instruction): instruction is InitiateTeleportInstruction =>
        typeof instruction === 'object' && instruction !== null && 'InitiateTeleport' in instruction
    )

  const getDepositAssetInstruction = (
    result: TCustomXcmResult
  ): DepositAssetInstruction | undefined =>
    result.find(
      (instruction): instruction is DepositAssetInstruction =>
        typeof instruction === 'object' && instruction !== null && 'DepositAsset' in instruction
    )

  const getBuyExecutionStep = (
    instruction: DepositReserveInstruction
  ): BuyExecutionStep | undefined =>
    instruction.DepositReserveAsset.xcm.find(
      (step): step is BuyExecutionStep =>
        typeof step === 'object' && step !== null && 'BuyExecution' in step
    )

  const mockApi = {} as IPolkadotApi<unknown, unknown>
  const mockAddress = '0x123'
  const mockVersion = Version.V3

  const isSystemChainSpy = vi.spyOn(sdkCommon, 'isSystemChain')

  const mockContext = {
    origin: { chain: 'AssetHubPolkadot', api: mockApi } as TChainWithApi<unknown, unknown>,
    dest: { chain: 'Acala' } as TChainWithApi<unknown, unknown>,
    reserve: { chain: 'Hydration', api: mockApi } as TChainWithApi<unknown, unknown>,
    assetInfo: { amount: 1000000n, location: RELAY_LOCATION },
    options: {
      destination: 'Acala',
      version: mockVersion,
      address: mockAddress
    }
  } as TTypeAndThenCallContext<unknown, unknown>

  beforeEach(() => {
    vi.clearAllMocks()
    isSystemChainSpy.mockImplementation(() => false)
    vi.mocked(createBeneficiaryLocation).mockImplementation(
      ({ api, address, version }) =>
        ({
          mockBeneficiary: { api, address, version }
        }) as unknown as TLocation
    )
  })

  afterAll(() => {
    isSystemChainSpy.mockRestore()
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
        1,
        true,
        {
          reserveFee: 0n,
          refundFee: 0n,
          destFee: 0n
        }
      )

      const depositReserveInstruction = getDepositReserveInstruction(result)
      expect(depositReserveInstruction).toBeDefined()
      expect(getDepositAssetInstruction(result)).toBeUndefined()

      const depositReserveAsset = depositReserveInstruction!.DepositReserveAsset
      expect(depositReserveAsset.assets).toEqual({ Wild: 'All' })
      expect(depositReserveAsset).toHaveProperty('dest')

      const xcm = depositReserveAsset.xcm as Array<Record<string, unknown>>
      expect(xcm).toHaveLength(2)
      expect(xcm[0]).toHaveProperty('BuyExecution')
      expect(xcm[1]).toHaveProperty('DepositAsset')
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
        2,
        false,
        {
          reserveFee: 100n,
          refundFee: 50n,
          destFee: 200n
        }
      )

      const depositReserveInstruction = getDepositReserveInstruction(result)
      expect(depositReserveInstruction).toBeDefined()

      const depositReserveAsset = depositReserveInstruction!.DepositReserveAsset
      expect(depositReserveAsset.assets).toHaveProperty('Definite')
      const definiteAssets = depositReserveAsset.assets.Definite
      expect(definiteAssets).toHaveLength(2)
      expect(definiteAssets?.[0].fun).toEqual({ Fungible: 300n }) // reserveFee + refundFee
      expect(definiteAssets?.[1].fun).toEqual({ Fungible: 1000000n })
    })

    it('returns InitiateTeleport when destination is a system chain', () => {
      isSystemChainSpy.mockImplementation(chain => chain === 'Kusama')

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
        false,
        2,
        false,
        {
          reserveFee: 100n,
          refundFee: 50n,
          destFee: 200n
        }
      )

      const initiateTeleportInstruction = getInitiateTeleportInstruction(result)
      expect(initiateTeleportInstruction).toBeDefined()
      expect(getDepositReserveInstruction(result)).toBeUndefined()

      const initiateTeleport = initiateTeleportInstruction!.InitiateTeleport
      expect(initiateTeleport.assets).toHaveProperty('Definite')
      expect(initiateTeleport.dest).toBeDefined()

      const xcm = initiateTeleport.xcm as Array<Record<string, unknown>>
      expect(xcm).toHaveLength(2)
      expect(xcm[0]).toHaveProperty('BuyExecution')
      expect(xcm[1]).toHaveProperty('DepositAsset')
    })

    it('uses destination api for beneficiary when bridge between AssetHubPolkadot and AssetHubKusama is in use', () => {
      const destApi = { id: 'destApi' } as unknown as IPolkadotApi<unknown, unknown>

      createCustomXcm(
        {
          ...mockContext,
          origin: { chain: 'AssetHubPolkadot', api: mockApi } as TChainWithApi<unknown, unknown>,
          dest: { chain: 'AssetHubKusama', api: destApi } as TChainWithApi<unknown, unknown>,
          reserve: { chain: 'AssetHubPolkadot', api: mockApi } as TChainWithApi<unknown, unknown>,
          isSubBridge: true
        },
        false,
        2,
        false,
        {
          reserveFee: 100n,
          refundFee: 50n,
          destFee: 200n
        }
      )

      expect(createBeneficiaryLocation).toHaveBeenCalledWith(
        expect.objectContaining({ api: destApi })
      )
    })

    it('excludes DOT from assetsFilter when asset location equals RELAY_LOCATION', () => {
      const result = createCustomXcm(mockContext, true, 1, false, {
        reserveFee: 100n,
        refundFee: 50n,
        destFee: 200n
      })

      const depositReserveInstruction = getDepositReserveInstruction(result)
      expect(depositReserveInstruction).toBeDefined()

      const depositReserveAsset = depositReserveInstruction!.DepositReserveAsset
      expect(depositReserveAsset.assets.Definite).toHaveLength(1)
      expect(depositReserveAsset.assets.Definite?.[0].fun).toEqual({ Fungible: 1000000n })
    })

    it('calculates BuyExecution fees correctly with DOT included', () => {
      const result = createCustomXcm(mockContext, false, 2, false, {
        reserveFee: 100n,
        refundFee: 50n,
        destFee: 200n
      })

      const depositReserveInstruction = getDepositReserveInstruction(result)
      expect(depositReserveInstruction).toBeDefined()

      const buyExecutionStep = getBuyExecutionStep(depositReserveInstruction!)
      expect(buyExecutionStep).toBeDefined()

      const buyExecution = buyExecutionStep!.BuyExecution
      expect(buyExecution.fees.fun.Fungible).toBe(200n)
      expect(buyExecution.fees.id).toEqual({
        localizedLocation: {
          chain: 'Acala',
          location: RELAY_LOCATION
        }
      })
      expect(buyExecution.weight_limit).toBe('Unlimited')
    })

    it('calculates BuyExecution fees correctly without DOT', () => {
      const result = createCustomXcm(mockContext, false, 2, false, {
        reserveFee: 100n,
        refundFee: 50n,
        destFee: 200n
      })

      const depositReserveInstruction = getDepositReserveInstruction(result)
      expect(depositReserveInstruction).toBeDefined()

      const buyExecutionStep = getBuyExecutionStep(depositReserveInstruction!)
      expect(buyExecutionStep).toBeDefined()

      const buyExecution = buyExecutionStep!.BuyExecution
      expect(buyExecution.fees.fun.Fungible).toBe(200n)
      expect(buyExecution.fees.id).toEqual({
        localizedLocation: {
          chain: 'Acala',
          location: RELAY_LOCATION
        }
      })
    })

    it('uses default fees when fees parameter not provided', () => {
      const result = createCustomXcm(mockContext, false, 2, false)

      const depositReserveInstruction = getDepositReserveInstruction(result)
      expect(depositReserveInstruction).toBeDefined()

      const depositReserveAsset = depositReserveInstruction!.DepositReserveAsset
      expect(depositReserveAsset.assets).toHaveProperty('Definite')

      const buyExecutionStep = getBuyExecutionStep(depositReserveInstruction!)
      if (buyExecutionStep) {
        expect(buyExecutionStep.BuyExecution.fees.fun.Fungible).toBe(0n)
      }
    })

    it('throws AmountTooLowError when buyExecutionAmount is negative', () => {
      expect(() =>
        createCustomXcm(
          {
            ...mockContext,
            origin: { chain: 'Astar', api: mockApi } as TChainWithApi<unknown, unknown>,
            assetInfo: { amount: 20n, location: RELAY_LOCATION } as WithAmount<TAssetWithLocation>
          },
          true,
          1,
          false,
          {
            reserveFee: 100n,
            refundFee: 50n,
            destFee: 200n
          }
        )
      ).toThrowError(AmountTooLowError)
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
        false,
        2,
        false
      )

      const depositAssetInstruction = getDepositAssetInstruction(result)
      expect(depositAssetInstruction).toBeDefined()
      expect(getDepositReserveInstruction(result)).toBeUndefined()

      const depositAsset = depositAssetInstruction!.DepositAsset
      expect(depositAsset.assets).toHaveProperty('Wild')
      expect(depositAsset.assets.Wild).toHaveProperty('AllOf')
      expect(depositAsset.assets.Wild.AllOf).toHaveProperty('id')
      expect(depositAsset.assets.Wild.AllOf).toHaveProperty('fun', 'Fungible')
      expect(depositAsset).toHaveProperty('beneficiary')
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
        false,
        2,
        false
      )

      const depositAssetInstruction = getDepositAssetInstruction(result)
      expect(depositAssetInstruction).toBeDefined()
      expect(getDepositReserveInstruction(result)).toBeUndefined()

      const depositAsset = depositAssetInstruction!.DepositAsset
      expect(depositAsset.beneficiary).toEqual({
        mockBeneficiary: {
          api: mockApi,
          address: mockAddress,
          version: mockVersion
        }
      })
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
        false,
        2,
        false
      )

      expect(getDepositAssetInstruction(result)).toBeDefined()
      expect(getDepositReserveInstruction(result)).toBeUndefined()
    })
  })
})

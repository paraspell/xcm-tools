import type { TLocation } from '@paraspell/sdk-common'
import { isSystemChain, Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { MIN_AMOUNT, RELAY_LOCATION } from '../../constants'
import { AmountTooLowError } from '../../errors'
import { createDestination } from '../../pallets/xcmPallet/utils'
import type { TTypeAndThenCallContext } from '../../types'
import { createBeneficiaryLocation, localizeLocation } from '../../utils'
import { createCustomXcm } from './createCustomXcm'

vi.mock('@paraspell/sdk-common')
vi.mock('../../pallets/xcmPallet/utils')
vi.mock('../../utils/location')

describe('createCustomXcm', () => {
  const isDepositReserveInstruction = (
    instruction: unknown
  ): instruction is Extract<
    ReturnType<typeof createCustomXcm>[number],
    { DepositReserveAsset: unknown }
  > =>
    typeof instruction === 'object' && instruction !== null && 'DepositReserveAsset' in instruction

  const isInitiateTeleportInstruction = (
    instruction: unknown
  ): instruction is Extract<
    ReturnType<typeof createCustomXcm>[number],
    { InitiateTeleport: unknown }
  > => typeof instruction === 'object' && instruction !== null && 'InitiateTeleport' in instruction

  const isDepositAssetInstruction = (
    instruction: unknown
  ): instruction is Extract<
    ReturnType<typeof createCustomXcm>[number],
    { DepositAsset: unknown }
  > => typeof instruction === 'object' && instruction !== null && 'DepositAsset' in instruction

  const isBuyExecutionStep = (
    step: unknown
  ): step is Extract<
    Extract<
      ReturnType<typeof createCustomXcm>[number],
      { DepositReserveAsset: unknown }
    >['DepositReserveAsset']['xcm'][number],
    { BuyExecution: unknown }
  > => typeof step === 'object' && step !== null && 'BuyExecution' in step

  const mockApi = {} as IPolkadotApi<unknown, unknown>
  const mockAddress = '0x123'
  const mockVersion = Version.V5

  const mockContext = {
    origin: { chain: 'AssetHubPolkadot', api: mockApi },
    dest: { chain: 'Acala' },
    reserve: { chain: 'Hydration', api: mockApi },
    assetInfo: { amount: 1000000n, location: RELAY_LOCATION },
    isRelayAsset: true,
    options: {
      destination: 'Acala',
      version: mockVersion,
      address: mockAddress
    }
  } as TTypeAndThenCallContext<unknown, unknown>

  const mockDestination: TLocation = {
    parents: 1,
    interior: { X1: { Parachain: 2000 } }
  }

  const mockBeneficiary: TLocation = {
    parents: 0,
    interior: { X1: { AccountId32: { network: 'Any', id: '0x123' } } }
  }

  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(createDestination).mockReturnValue(mockDestination)
    vi.mocked(createBeneficiaryLocation).mockReturnValue(mockBeneficiary)
    vi.mocked(localizeLocation).mockImplementation((_, location) => location)
    vi.mocked(isSystemChain).mockReturnValue(false)
  })

  describe('DepositReserveAsset (different chains)', () => {
    it('uses Definite assets when destFee is not MIN_FEE', () => {
      const result = createCustomXcm(
        {
          ...mockContext,
          origin: {
            chain: 'AssetHubPolkadot',
            api: mockApi
          },
          dest: {
            chain: 'Hydration',
            api: mockApi
          },
          reserve: {
            chain: 'Acala',
            api: mockApi
          },
          isRelayAsset: false
        },
        2,
        false,
        mockContext.assetInfo.amount,
        {
          hopFees: 100n,
          destFee: 200n
        }
      )

      const depositReserveInstruction = result.find(isDepositReserveInstruction)
      expect(depositReserveInstruction).toBeDefined()

      const depositReserveAsset = depositReserveInstruction!.DepositReserveAsset
      expect(depositReserveAsset.assets).toHaveProperty('Definite')
      const definiteAssets = depositReserveAsset.assets.Definite
      expect(definiteAssets).toHaveLength(2)
      expect(definiteAssets?.[0].fun).toEqual({ Fungible: 300n }) // hopFees + destFee
      expect(definiteAssets?.[1].fun).toEqual({ Fungible: 1000000n })
    })

    it('returns InitiateTeleport when destination is a system chain', () => {
      vi.mocked(isSystemChain).mockImplementation(chain => chain === 'Kusama')

      const result = createCustomXcm(
        {
          ...mockContext,
          origin: {
            chain: 'AssetHubPolkadot',
            api: mockApi
          },
          dest: {
            chain: 'Kusama',
            api: mockApi
          },
          reserve: {
            chain: 'Hydration',
            api: mockApi
          },
          isRelayAsset: false
        },
        2,
        false,
        mockContext.assetInfo.amount,
        {
          hopFees: 100n,
          destFee: 200n
        }
      )

      const initiateTeleportInstruction = result.find(isInitiateTeleportInstruction)
      expect(initiateTeleportInstruction).toBeDefined()
      expect(result.find(isDepositReserveInstruction)).toBeUndefined()

      const initiateTeleport = initiateTeleportInstruction!.InitiateTeleport
      expect(initiateTeleport.assets).toHaveProperty('Definite')
      expect(initiateTeleport.dest).toBeDefined()

      const xcm = initiateTeleport.xcm
      expect(xcm).toHaveLength(2)
      expect(xcm[0]).toHaveProperty('BuyExecution')
      expect(xcm[1]).toHaveProperty('DepositAsset')
    })

    it('uses destination api for beneficiary when bridge between AssetHubPolkadot and AssetHubKusama is in use', () => {
      const destApi = {} as IPolkadotApi<unknown, unknown>

      createCustomXcm(
        {
          ...mockContext,
          origin: { chain: 'AssetHubPolkadot', api: mockApi },
          dest: { chain: 'AssetHubKusama', api: destApi },
          reserve: { chain: 'AssetHubPolkadot', api: mockApi },
          isSubBridge: true,
          isRelayAsset: false
        },
        2,
        false,
        mockContext.assetInfo.amount,
        {
          hopFees: 100n,
          destFee: 200n
        }
      )

      expect(createBeneficiaryLocation).toHaveBeenCalledWith(
        expect.objectContaining({ api: destApi })
      )
    })

    it('excludes DOT from assetsFilter when asset location equals RELAY_LOCATION', () => {
      const result = createCustomXcm(mockContext, 1, false, mockContext.assetInfo.amount, {
        hopFees: 100n,
        destFee: 200n
      })

      const depositReserveInstruction = result.find(isDepositReserveInstruction)
      expect(depositReserveInstruction).toBeDefined()

      const depositReserveAsset = depositReserveInstruction!.DepositReserveAsset
      expect(depositReserveAsset.assets.Definite).toHaveLength(1)
      expect(depositReserveAsset.assets.Definite?.[0].fun).toEqual({ Fungible: 1000000n })
    })

    it('calculates BuyExecution fees correctly with DOT included', () => {
      const result = createCustomXcm(
        {
          ...mockContext,
          isRelayAsset: false
        },
        2,
        false,
        mockContext.assetInfo.amount,
        {
          hopFees: 100n,
          destFee: 200n
        }
      )

      const depositReserveInstruction = result.find(isDepositReserveInstruction)
      expect(depositReserveInstruction).toBeDefined()

      const buyExecutionStep =
        depositReserveInstruction!.DepositReserveAsset.xcm.find(isBuyExecutionStep)
      expect(buyExecutionStep).toBeDefined()

      const buyExecution = buyExecutionStep!.BuyExecution
      expect(buyExecution.fees.fun.Fungible).toBe(200n)
      expect(buyExecution.fees.id).toEqual(RELAY_LOCATION)
      expect(buyExecution.weight_limit).toBe('Unlimited')
    })

    it('calculates BuyExecution fees correctly without DOT', () => {
      const result = createCustomXcm(
        { ...mockContext, isRelayAsset: false },
        2,
        false,
        mockContext.assetInfo.amount,
        {
          hopFees: 100n,
          destFee: 200n
        }
      )

      const depositReserveInstruction = result.find(isDepositReserveInstruction)
      expect(depositReserveInstruction).toBeDefined()

      const buyExecutionStep =
        depositReserveInstruction!.DepositReserveAsset.xcm.find(isBuyExecutionStep)
      expect(buyExecutionStep).toBeDefined()

      const buyExecution = buyExecutionStep!.BuyExecution
      expect(buyExecution.fees.fun.Fungible).toBe(200n)
      expect(buyExecution.fees.id).toEqual(RELAY_LOCATION)
    })

    it('uses default fees when fees parameter not provided', () => {
      const result = createCustomXcm(
        {
          ...mockContext,
          isRelayAsset: false
        },
        2,
        false,
        mockContext.assetInfo.amount
      )

      const depositReserveInstruction = result.find(isDepositReserveInstruction)
      expect(depositReserveInstruction).toBeDefined()

      const depositReserveAsset = depositReserveInstruction!.DepositReserveAsset
      expect(depositReserveAsset.assets).toHaveProperty('Definite')

      const buyExecutionStep =
        depositReserveInstruction!.DepositReserveAsset.xcm.find(isBuyExecutionStep)
      if (buyExecutionStep) {
        expect(buyExecutionStep.BuyExecution.fees.fun.Fungible).toBe(MIN_AMOUNT)
      }
    })

    it('throws AmountTooLowError when buyExecutionAmount is negative', () => {
      expect(() =>
        createCustomXcm(
          {
            ...mockContext,
            origin: { chain: 'Astar', api: mockApi },
            assetInfo: { ...mockContext.assetInfo, amount: 20n, location: RELAY_LOCATION },
            isRelayAsset: true
          },
          1,
          false,
          20n,
          {
            hopFees: 100n,
            destFee: 200n
          }
        )
      ).toThrowError(AmountTooLowError)
    })
  })

  describe('DepositAsset (same chain scenarios)', () => {
    it('returns DepositAsset when chain equals reserveChain', () => {
      const result = createCustomXcm(
        {
          ...mockContext,
          origin: {
            chain: 'AssetHubPolkadot',
            api: mockApi
          },
          dest: {
            chain: 'Acala',
            api: mockApi
          },
          reserve: {
            chain: 'AssetHubPolkadot',
            api: mockApi
          },
          isRelayAsset: false
        },
        2,
        false,
        mockContext.assetInfo.amount
      )

      const depositAssetInstruction = result.find(isDepositAssetInstruction)
      expect(depositAssetInstruction).toBeDefined()
      expect(result.find(isDepositReserveInstruction)).toBeUndefined()

      const depositAsset = depositAssetInstruction!.DepositAsset
      expect(depositAsset.assets).toHaveProperty('Wild')
      expect(depositAsset.assets.Wild).toHaveProperty('AllOf')
      expect(depositAsset.assets.Wild.AllOf).toHaveProperty('id')
      expect(depositAsset.assets.Wild.AllOf).toHaveProperty('fun', 'Fungible')
      expect(depositAsset).toHaveProperty('beneficiary')
    })

    it('returns DepositAsset when destChain equals reserveChain', () => {
      const result = createCustomXcm(
        {
          ...mockContext,
          origin: {
            chain: 'Polkadot',
            api: mockApi
          },
          dest: {
            chain: 'AssetHubPolkadot',
            api: mockApi
          },
          reserve: {
            chain: 'AssetHubPolkadot',
            api: mockApi
          },
          isRelayAsset: false
        },
        2,
        false,
        mockContext.assetInfo.amount
      )

      const depositAssetInstruction = result.find(isDepositAssetInstruction)
      expect(depositAssetInstruction).toBeDefined()
      expect(result.find(isDepositReserveInstruction)).toBeUndefined()

      const depositAsset = depositAssetInstruction!.DepositAsset
      expect(depositAsset.beneficiary).toEqual(mockBeneficiary)
    })

    it('returns DepositAsset when both chain and destChain equal reserveChain', () => {
      const result = createCustomXcm(
        {
          ...mockContext,
          origin: {
            chain: 'AssetHubPolkadot',
            api: mockApi
          },
          dest: {
            chain: 'AssetHubPolkadot',
            api: mockApi
          },
          reserve: {
            chain: 'AssetHubPolkadot',
            api: mockApi
          },
          isRelayAsset: false
        },
        2,
        false,
        mockContext.assetInfo.amount
      )

      expect(result.find(isDepositAssetInstruction)).toBeDefined()
      expect(result.find(isDepositReserveInstruction)).toBeUndefined()
    })
  })
})

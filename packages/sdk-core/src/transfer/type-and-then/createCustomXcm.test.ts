import { isChainEvm } from '@paraspell/assets'
import type { TLocation } from '@paraspell/sdk-common'
import { isTrustedChain, Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
import { getParaId } from '../../chains/config'
import { MIN_AMOUNT, RELAY_LOCATION } from '../../constants'
import { AmountTooLowError, MissingParameterError } from '../../errors'
import type { TTypeAndThenCallContext } from '../../types'
import { createBeneficiaryLocation, createDestination, localizeLocation } from '../../utils'
import { generateMessageId } from '../../utils/ethereum/generateMessageId'
import { createCustomXcm } from './createCustomXcm'

vi.mock('@paraspell/assets', async importActual => ({
  ...(await importActual()),
  isChainEvm: vi.fn()
}))
vi.mock('@paraspell/sdk-common')
vi.mock('../../utils/location')
vi.mock('../../utils/ethereum/generateMessageId')
vi.mock('../../chains/config', async importActual => ({
  ...(await importActual()),
  getParaId: vi.fn()
}))

describe('createCustomXcm', () => {
  const isDepositReserveInstruction = (
    instruction: unknown
  ): instruction is Extract<
    Awaited<ReturnType<typeof createCustomXcm>>[number],
    { DepositReserveAsset: unknown }
  > =>
    typeof instruction === 'object' && instruction !== null && 'DepositReserveAsset' in instruction

  const isInitiateTeleportInstruction = (
    instruction: unknown
  ): instruction is Extract<
    Awaited<ReturnType<typeof createCustomXcm>>[number],
    { InitiateTeleport: unknown }
  > => typeof instruction === 'object' && instruction !== null && 'InitiateTeleport' in instruction

  const isDepositAssetInstruction = (
    instruction: unknown
  ): instruction is Extract<
    Awaited<ReturnType<typeof createCustomXcm>>[number],
    { DepositAsset: unknown }
  > => typeof instruction === 'object' && instruction !== null && 'DepositAsset' in instruction

  const isBuyExecutionStep = (
    step: unknown
  ): step is Extract<
    Extract<
      Awaited<ReturnType<typeof createCustomXcm>>[number],
      { DepositReserveAsset: unknown }
    >['DepositReserveAsset']['xcm'][number],
    { BuyExecution: unknown }
  > => typeof step === 'object' && step !== null && 'BuyExecution' in step

  const mockApi = {} as PolkadotApi<unknown, unknown, unknown>
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
      recipient: mockAddress
    }
  } as TTypeAndThenCallContext<unknown, unknown, unknown>

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
    vi.mocked(isTrustedChain).mockReturnValue(false)
    vi.mocked(isChainEvm).mockReturnValue(false)
  })

  describe('DepositReserveAsset (different chains)', () => {
    it('uses Definite assets when destFee is not MIN_FEE', async () => {
      const result = await createCustomXcm(
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

    it('returns InitiateTeleport when reserve and destination are system chains', async () => {
      vi.mocked(isTrustedChain).mockImplementation(
        chain => chain === 'Kusama' || chain === 'Hydration'
      )

      const result = await createCustomXcm(
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

    it('uses destination api for beneficiary when bridge between AssetHubPolkadot and AssetHubKusama is in use', async () => {
      const destApi = {} as PolkadotApi<unknown, unknown, unknown>

      await createCustomXcm(
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

    it('excludes DOT from assetsFilter when asset location equals RELAY_LOCATION', async () => {
      const result = await createCustomXcm(mockContext, 1, false, mockContext.assetInfo.amount, {
        hopFees: 100n,
        destFee: 200n
      })

      const depositReserveInstruction = result.find(isDepositReserveInstruction)
      expect(depositReserveInstruction).toBeDefined()

      const depositReserveAsset = depositReserveInstruction!.DepositReserveAsset
      expect(depositReserveAsset.assets.Definite).toHaveLength(1)
      expect(depositReserveAsset.assets.Definite?.[0].fun).toEqual({ Fungible: 1000000n })
    })

    it('calculates BuyExecution fees correctly with DOT included', async () => {
      const result = await createCustomXcm(
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

    it('calculates BuyExecution fees correctly without DOT', async () => {
      const result = await createCustomXcm(
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

    it('uses default fees when fees parameter not provided', async () => {
      const result = await createCustomXcm(
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

    it('throws AmountTooLowError when buyExecutionAmount is negative', async () => {
      await expect(
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
      ).rejects.toThrow(AmountTooLowError)
    })
  })

  describe('DepositAsset (same chain scenarios)', () => {
    it('returns DepositAsset when chain equals reserveChain', async () => {
      const result = await createCustomXcm(
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
      if ('AllOf' in depositAsset.assets.Wild) {
        expect(depositAsset.assets.Wild.AllOf).toHaveProperty('id')
        expect(depositAsset.assets.Wild.AllOf).toHaveProperty('fun', 'Fungible')
      }
      expect(depositAsset).toHaveProperty('beneficiary')
    })

    it('returns DepositAsset when destChain equals reserveChain', async () => {
      const result = await createCustomXcm(
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

    it('returns DepositAsset when both chain and destChain equal reserveChain', async () => {
      const result = await createCustomXcm(
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

  describe('refund instruction address resolution', () => {
    const hopContext = {
      ...mockContext,
      origin: { chain: 'Hydration', api: mockApi },
      dest: { chain: 'Acala', api: mockApi },
      reserve: { chain: 'AssetHubPolkadot', api: mockApi },
      isRelayAsset: false
    } as TTypeAndThenCallContext<unknown, unknown, unknown>

    const isRefundInstruction = (instruction: unknown): instruction is { SetAppendix: unknown[] } =>
      typeof instruction === 'object' && instruction !== null && 'SetAppendix' in instruction

    it('prefers ahAddress when provided', async () => {
      vi.mocked(isChainEvm).mockReturnValue(true)

      const result = await createCustomXcm(
        {
          ...hopContext,
          options: {
            ...hopContext.options,
            sender: '0xsender',
            ahAddress: 'ah-address'
          }
        },
        2,
        false,
        mockContext.assetInfo.amount
      )

      expect(result.find(isRefundInstruction)).toBeDefined()
      expect(createBeneficiaryLocation).toHaveBeenCalledWith(
        expect.objectContaining({ address: 'ah-address' })
      )
    })

    it('uses sender when origin is not EVM and ahAddress is missing', async () => {
      vi.mocked(isChainEvm).mockReturnValue(false)

      const result = await createCustomXcm(
        {
          ...hopContext,
          options: { ...hopContext.options, sender: 'ss58-sender' }
        },
        2,
        false,
        mockContext.assetInfo.amount
      )

      expect(result.find(isRefundInstruction)).toBeDefined()
      expect(createBeneficiaryLocation).toHaveBeenCalledWith(
        expect.objectContaining({ address: 'ss58-sender' })
      )
    })

    it('uses recipient when origin is EVM but destination is not EVM and ahAddress is missing', async () => {
      vi.mocked(isChainEvm).mockImplementation(chain => chain === 'Moonbeam')

      const result = await createCustomXcm(
        {
          ...hopContext,
          origin: { chain: 'Moonbeam', api: mockApi },
          options: {
            ...hopContext.options,
            sender: '0xsender',
            recipient: 'ss58-recipient'
          }
        },
        2,
        false,
        mockContext.assetInfo.amount
      )

      expect(result.find(isRefundInstruction)).toBeDefined()
      expect(createBeneficiaryLocation).toHaveBeenCalledWith(
        expect.objectContaining({ address: 'ss58-recipient' })
      )
    })

    it('throws MissingParameterError when both origin and destination are EVM and ahAddress is missing', async () => {
      vi.mocked(isChainEvm).mockReturnValue(true)

      await expect(
        createCustomXcm(
          {
            ...hopContext,
            origin: { chain: 'Moonbeam', api: mockApi },
            dest: { chain: 'Ethereum', api: mockApi },
            options: {
              ...hopContext.options,
              sender: '0xsender'
            }
          },
          2,
          false,
          mockContext.assetInfo.amount
        )
      ).rejects.toThrow(MissingParameterError)
    })

    it('does not emit refund instruction when sender is absent', async () => {
      const result = await createCustomXcm(
        {
          ...hopContext,
          options: { ...hopContext.options }
        },
        2,
        false,
        mockContext.assetInfo.amount
      )

      expect(result.find(isRefundInstruction)).toBeUndefined()
    })
  })

  describe('snowbridge message id resolution', () => {
    const isSetTopic = (instruction: unknown): instruction is { SetTopic: string } =>
      typeof instruction === 'object' && instruction !== null && 'SetTopic' in instruction

    it('generates a message id and emits SetTopic when isSnowbridge is true', async () => {
      vi.mocked(generateMessageId).mockResolvedValue('0xmessage-id')
      vi.mocked(getParaId).mockReturnValue(2034)

      const snowbridgeContext = {
        ...mockContext,
        origin: { chain: 'Hydration', api: mockApi },
        dest: { chain: 'Ethereum', api: mockApi },
        reserve: { chain: 'AssetHubPolkadot', api: mockApi },
        isSnowbridge: true,
        isRelayAsset: false,
        assetInfo: {
          amount: 1000000n,
          location: {
            parents: 2,
            interior: { X1: [{ GlobalConsensus: { Ethereum: { chainId: 1 } } }] }
          }
        },
        options: {
          ...mockContext.options,
          destination: 'Ethereum',
          recipient: '0xrecipient',
          sender: 'ss58-sender'
        }
      } as TTypeAndThenCallContext<unknown, unknown, unknown>

      const result = await createCustomXcm(
        snowbridgeContext,
        2,
        false,
        mockContext.assetInfo.amount
      )

      expect(generateMessageId).toHaveBeenCalledWith(
        mockApi,
        'ss58-sender',
        2034,
        JSON.stringify(snowbridgeContext.assetInfo.location),
        JSON.stringify('0xrecipient'),
        snowbridgeContext.assetInfo.amount
      )
      expect(result.find(isSetTopic)).toBeDefined()
    })

    it('does not generate a message id when isSnowbridge is false', async () => {
      await createCustomXcm(
        {
          ...mockContext,
          isSnowbridge: false
        },
        2,
        false,
        mockContext.assetInfo.amount
      )

      expect(generateMessageId).not.toHaveBeenCalled()
    })
  })
})

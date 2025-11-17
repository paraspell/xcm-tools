/* eslint-disable @typescript-eslint/unbound-method */
import type { TForeignAssetInfo } from '@paraspell/assets'
import { InvalidCurrencyError } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import {
  ChainNotSupportedError,
  InvalidParameterError,
  ScenarioNotSupportedError
} from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import { getParaEthTransferFees } from '../../transfer'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { getChain } from '../../utils'
import { createCustomXcmOnDest } from '../../utils/ethereum/createCustomXcmOnDest'
import { generateMessageId } from '../../utils/ethereum/generateMessageId'
import { handleToAhTeleport } from '../../utils/transfer'
import type Mythos from './Mythos'
import { createTypeAndThenTransfer } from './Mythos'

vi.mock('../../pallets/polkadotXcm')
vi.mock('../../utils/transfer')
vi.mock('../../transfer')
vi.mock('../../utils/ethereum/generateMessageId')
vi.mock('../../utils/ethereum/createCustomXcmOnDest')

describe('Mythos', () => {
  let mythos: Mythos<unknown, unknown>
  const mockInput = {
    assetInfo: { symbol: 'MYTH', amount: 100n },
    scenario: 'ParaToPara',
    destination: 'Acala'
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  beforeEach(() => {
    vi.clearAllMocks()
    mythos = getChain<unknown, unknown, 'Mythos'>('Mythos')
  })

  it('should initialize with correct values', () => {
    expect(mythos.chain).toBe('Mythos')
    expect(mythos.info).toBe('mythos')
    expect(mythos.ecosystem).toBe('Polkadot')
    expect(mythos.version).toBe(Version.V5)
  })

  it('should call transferPolkadotXCM with limitedReserveTransferAssets for non-AssetHubPolkadot destination', async () => {
    vi.spyOn(mythos, 'getNativeAssetSymbol').mockReturnValue('MYTH')
    await mythos.transferPolkadotXCM(mockInput)
    expect(transferPolkadotXcm).toHaveBeenCalledWith(
      mockInput,
      'limited_reserve_transfer_assets',
      'Unlimited'
    )
  })

  it('should call transferPolkadotXCM with limitedTeleportAssets for AssetHubPolkadot destination', async () => {
    vi.spyOn(mythos, 'getNativeAssetSymbol').mockReturnValue('MYTH')

    await mythos.transferPolkadotXCM({ ...mockInput, destination: 'AssetHubPolkadot' })

    expect(transferPolkadotXcm).toHaveBeenCalledWith(
      { ...mockInput, destination: 'AssetHubPolkadot' },
      'limited_teleport_assets',
      'Unlimited'
    )
  })

  it('should throw ScenarioNotSupportedError for unsupported scenario', async () => {
    const invalidInput = { ...mockInput, scenario: 'ParaToRelay' } as TPolkadotXCMTransferOptions<
      unknown,
      unknown
    >

    await expect(mythos.transferPolkadotXCM(invalidInput)).rejects.toThrowError(
      ScenarioNotSupportedError
    )
  })

  it('should throw InvalidCurrencyError for unsupported currency', async () => {
    vi.spyOn(mythos, 'getNativeAssetSymbol').mockReturnValue('NOT_MYTH')

    await expect(mythos.transferPolkadotXCM(mockInput)).rejects.toThrowError(
      new InvalidCurrencyError(`Chain Mythos does not support currency MYTH`)
    )
  })

  it('should handle to Ah teleport', async () => {
    vi.spyOn(mythos, 'getNativeAssetSymbol').mockReturnValue('MYTH')
    const mockTx = { module: 'test', method: 'test' }
    vi.mocked(transferPolkadotXcm).mockResolvedValue(mockTx)
    vi.mocked(handleToAhTeleport).mockResolvedValue('handled')

    const result = await mythos.transferPolkadotXCM({
      ...mockInput,
      destination: 'AssetHubPolkadot'
    })

    expect(handleToAhTeleport).toHaveBeenCalledWith(
      'Mythos',
      { ...mockInput, destination: 'AssetHubPolkadot' },
      mockTx
    )
    expect(result).toBe('handled')
  })

  it('should throw ChainNotSupportedError for transferRelayToPara', () => {
    expect(() => mythos.transferRelayToPara()).toThrowError(ChainNotSupportedError)
  })

  describe('Ethereum transfers', () => {
    const mockApi = {
      clone: vi.fn(),
      init: vi.fn(),
      quoteAhPrice: vi.fn(),
      deserializeExtrinsics: vi.fn()
    } as unknown as IPolkadotApi<unknown, unknown>

    const mockEthereumInput = {
      api: mockApi,
      assetInfo: {
        symbol: 'MYTH',
        amount: 100n,
        location: { parents: 0, interior: 'Here' },
        assetId: '123'
      },
      scenario: 'ParaToPara',
      destination: 'Ethereum',
      senderAddress: '0x1234567890123456789012345678901234567890',
      address: '0x0987654321098765432109876543210987654321'
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    beforeEach(() => {
      vi.spyOn(mythos, 'getNativeAssetSymbol').mockReturnValue('MYTH')

      vi.spyOn(mockApi, 'clone').mockReturnValue(mockApi)
      vi.spyOn(mockApi, 'init').mockResolvedValue(undefined)
      vi.spyOn(mockApi, 'quoteAhPrice').mockResolvedValue(1000n)
      vi.spyOn(mockApi, 'deserializeExtrinsics').mockResolvedValue('ethereum_tx_result')
    })

    it('should handle Ethereum transfers with createTypeAndThenTransfer', async () => {
      vi.mocked(generateMessageId).mockResolvedValue('message_id_123')
      vi.mocked(getParaEthTransferFees).mockResolvedValue([500n, 300n])
      vi.mocked(createCustomXcmOnDest).mockReturnValue([
        { instruction: 'test' }
      ] as unknown as ReturnType<typeof createCustomXcmOnDest>)

      const result = await mythos.transferPolkadotXCM(mockEthereumInput)

      expect(generateMessageId).toHaveBeenCalledWith(
        mockApi,
        mockEthereumInput.senderAddress,
        expect.any(Number),
        '123',
        mockEthereumInput.address,
        100n
      )
      expect(getParaEthTransferFees).toHaveBeenCalledWith(mockApi)
      expect(mockApi.quoteAhPrice).toHaveBeenCalled()
      expect(mockApi.deserializeExtrinsics).toHaveBeenCalled()
      expect(result).toBe('ethereum_tx_result')
    })

    it('should call createTypeAndThenTransfer for Ethereum destination', async () => {
      vi.mocked(generateMessageId).mockResolvedValue('message_id_456')
      vi.mocked(getParaEthTransferFees).mockResolvedValue([500n, 300n])
      vi.mocked(createCustomXcmOnDest).mockReturnValue([
        { instruction: 'test' }
      ] as unknown as ReturnType<typeof createCustomXcmOnDest>)

      await mythos.transferPolkadotXCM(mockEthereumInput)

      expect(mockApi.deserializeExtrinsics).toHaveBeenCalledWith(
        expect.objectContaining({
          module: 'PolkadotXcm',
          method: 'transfer_assets_using_type_and_then',
          params: expect.objectContaining({
            dest: expect.any(Object),
            assets: expect.any(Object),
            assets_transfer_type: 'DestinationReserve',
            fees_transfer_type: 'Teleport',
            weight_limit: 'Unlimited'
          })
        })
      )
    })
  })
})

describe('createTypeAndThenTransfer', () => {
  const mockApi = {
    clone: vi.fn(),
    init: vi.fn(),
    quoteAhPrice: vi.fn()
  } as unknown as IPolkadotApi<unknown, unknown>

  const mockOptions = {
    api: mockApi,
    scenario: 'ParaToPara',
    assetInfo: {
      symbol: 'MYTH',
      amount: 1000n,
      location: { parents: 0, interior: 'Here' },
      assetId: '123'
    },
    currency: { symbol: 'MYTH' },
    senderAddress: '0x1234567890123456789012345678901234567890',
    address: '0x0987654321098765432109876543210987654321',
    destination: 'Ethereum'
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(mockApi, 'clone').mockReturnValue(mockApi)
    vi.spyOn(mockApi, 'init').mockResolvedValue(undefined)
  })

  it('should throw InvalidCurrencyError for non-foreign assets', async () => {
    const optionsWithNonForeignAsset = {
      ...mockOptions,
      assetInfo: { ...mockOptions.assetInfo, assetId: undefined }
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    await expect(
      createTypeAndThenTransfer(optionsWithNonForeignAsset, 'Mythos', Version.V4)
    ).rejects.toThrowError(InvalidCurrencyError)
  })

  it('should throw InvalidParameterError when DOT pool is not found', async () => {
    vi.mocked(generateMessageId).mockResolvedValue('message_id_123')
    vi.mocked(getParaEthTransferFees).mockResolvedValue([500n, 300n])
    vi.spyOn(mockApi, 'quoteAhPrice').mockResolvedValue(undefined)

    await expect(createTypeAndThenTransfer(mockOptions, 'Mythos', Version.V4)).rejects.toThrowError(
      new InvalidParameterError('Pool DOT -> MYTH not found.')
    )
  })

  it('should successfully create transfer call with sufficient balance', async () => {
    vi.mocked(generateMessageId).mockResolvedValue('message_id_123')
    vi.mocked(getParaEthTransferFees).mockResolvedValue([500n, 300n])
    vi.spyOn(mockApi, 'quoteAhPrice').mockResolvedValue(1000n)
    vi.mocked(createCustomXcmOnDest).mockReturnValue([
      { instruction: 'test' }
    ] as unknown as ReturnType<typeof createCustomXcmOnDest>)

    const result = await createTypeAndThenTransfer(mockOptions, 'Mythos', Version.V4)

    expect(result).toEqual({
      module: 'PolkadotXcm',
      method: 'transfer_assets_using_type_and_then',
      params: expect.objectContaining({
        dest: expect.any(Object),
        assets: expect.any(Object),
        assets_transfer_type: 'DestinationReserve',
        remote_fees_id: expect.any(Object),
        fees_transfer_type: 'Teleport',
        custom_xcm_on_dest: [{ instruction: 'test' }],
        weight_limit: 'Unlimited'
      })
    })
  })

  it('should call all required functions with correct parameters', async () => {
    vi.mocked(generateMessageId).mockResolvedValue('message_id_123')
    vi.mocked(getParaEthTransferFees).mockResolvedValue([500n, 300n])
    vi.spyOn(mockApi, 'quoteAhPrice').mockResolvedValue(1000n)
    vi.mocked(createCustomXcmOnDest).mockReturnValue([
      { instruction: 'test' }
    ] as unknown as ReturnType<typeof createCustomXcmOnDest>)

    await createTypeAndThenTransfer(mockOptions, 'Mythos', Version.V4)

    expect(generateMessageId).toHaveBeenCalledWith(
      mockApi,
      mockOptions.senderAddress,
      expect.any(Number), // paraId
      (mockOptions.assetInfo as TForeignAssetInfo).assetId,
      mockOptions.address,
      mockOptions.assetInfo.amount
    )
    expect(mockApi.clone).toHaveBeenCalled()
    expect(mockApi.init).toHaveBeenCalledWith('AssetHubPolkadot')
    expect(getParaEthTransferFees).toHaveBeenCalledWith(mockApi)
    expect(createCustomXcmOnDest).toHaveBeenCalledWith(mockOptions, 'Mythos', 'message_id_123')
  })

  it('should handle different asset amounts correctly', async () => {
    const largeAmountOptions = {
      ...mockOptions,
      assetInfo: { ...mockOptions.assetInfo, amount: 999999999999n }
    }

    vi.mocked(generateMessageId).mockResolvedValue('message_id_large')
    vi.mocked(getParaEthTransferFees).mockResolvedValue([500n, 300n])
    vi.spyOn(mockApi, 'quoteAhPrice').mockResolvedValue(2000n)
    vi.mocked(createCustomXcmOnDest).mockReturnValue([
      { instruction: 'test' }
    ] as unknown as ReturnType<typeof createCustomXcmOnDest>)

    const result = await createTypeAndThenTransfer(largeAmountOptions, 'Mythos', Version.V4)

    expect(result).toEqual({
      module: 'PolkadotXcm',
      method: 'transfer_assets_using_type_and_then',
      params: expect.objectContaining({
        dest: expect.any(Object),
        assets: {
          [Version.V4]: expect.arrayContaining([
            expect.objectContaining({
              id: largeAmountOptions.assetInfo.location,
              fun: { Fungible: 999999999999n }
            })
          ])
        },
        assets_transfer_type: 'DestinationReserve',
        remote_fees_id: expect.any(Object),
        fees_transfer_type: 'Teleport',
        custom_xcm_on_dest: [{ instruction: 'test' }],
        weight_limit: 'Unlimited'
      })
    })
  })
})

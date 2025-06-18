/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/unbound-method */
import type { TForeignAsset } from '@paraspell/assets'
import { InvalidCurrencyError } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import {
  InvalidParameterError,
  NodeNotSupportedError,
  ScenarioNotSupportedError
} from '../../errors'
import { getAssetBalanceInternal } from '../../pallets/assets'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import { getParaEthTransferFees } from '../../transfer'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { getNode } from '../../utils'
import { createCustomXcmOnDest } from '../../utils/ethereum/createCustomXcmOnDest'
import { generateMessageId } from '../../utils/ethereum/generateMessageId'
import { handleToAhTeleport } from '../../utils/transfer'
import type Mythos from './Mythos'
import { createTypeAndThenTransfer } from './Mythos'

vi.mock('../../pallets/polkadotXcm', () => ({
  transferPolkadotXcm: vi.fn()
}))

vi.mock('../../utils/transfer', () => ({
  handleToAhTeleport: vi.fn()
}))

vi.mock('../../pallets/assets', () => ({
  getAssetBalanceInternal: vi.fn()
}))

vi.mock('../../transfer', () => ({
  getParaEthTransferFees: vi.fn()
}))

vi.mock('../../utils/ethereum/generateMessageId', () => ({
  generateMessageId: vi.fn()
}))

vi.mock('../../utils/ethereum/createCustomXcmOnDest', () => ({
  createCustomXcmOnDest: vi.fn()
}))

describe('Mythos', () => {
  let mythos: Mythos<unknown, unknown>
  const mockInput = {
    asset: { symbol: 'MYTH', amount: '100' },
    scenario: 'ParaToPara',
    destination: 'Acala'
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  beforeEach(() => {
    vi.clearAllMocks()
    mythos = getNode<unknown, unknown, 'Mythos'>('Mythos')
  })

  it('should initialize with correct values', () => {
    expect(mythos.node).toBe('Mythos')
    expect(mythos.info).toBe('mythos')
    expect(mythos.type).toBe('polkadot')
    expect(mythos.version).toBe(Version.V4)
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
      new InvalidCurrencyError(`Node Mythos does not support currency MYTH`)
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

  it('should throw NodeNotSupportedError for transferRelayToPara', () => {
    expect(() => mythos.transferRelayToPara()).toThrowError(NodeNotSupportedError)
  })

  describe('Ethereum transfers', () => {
    const mockApi = {
      clone: vi.fn(),
      init: vi.fn(),
      quoteAhPrice: vi.fn(),
      callTxMethod: vi.fn()
    } as unknown as IPolkadotApi<unknown, unknown>

    const mockEthereumInput = {
      api: mockApi,
      asset: {
        symbol: 'MYTH',
        amount: '100',
        multiLocation: { parents: 0, interior: 'Here' },
        assetId: '123'
      },
      scenario: 'ParaToPara',
      destination: 'Ethereum',
      senderAddress: '0x1234567890123456789012345678901234567890',
      address: '0x0987654321098765432109876543210987654321',
      currency: { symbol: 'MYTH' }
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    beforeEach(() => {
      vi.spyOn(mythos, 'getNativeAssetSymbol').mockReturnValue('MYTH')

      vi.spyOn(mockApi, 'clone').mockReturnValue(mockApi)
      vi.spyOn(mockApi, 'init').mockResolvedValue(undefined)
      vi.spyOn(mockApi, 'quoteAhPrice').mockResolvedValue(1000n)
      vi.spyOn(mockApi, 'callTxMethod').mockResolvedValue('ethereum_tx_result')
    })

    it('should handle Ethereum transfers with createTypeAndThenTransfer', async () => {
      vi.mocked(generateMessageId).mockResolvedValue('message_id_123')
      vi.mocked(getParaEthTransferFees).mockResolvedValue([500n, 300n])
      vi.mocked(getAssetBalanceInternal).mockResolvedValue(5000n)
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
        '100'
      )
      expect(getParaEthTransferFees).toHaveBeenCalledWith(mockApi)
      expect(mockApi.quoteAhPrice).toHaveBeenCalled()
      expect(getAssetBalanceInternal).toHaveBeenCalled()
      expect(mockApi.callTxMethod).toHaveBeenCalled()
      expect(result).toBe('ethereum_tx_result')
    })

    it('should call createTypeAndThenTransfer for Ethereum destination', async () => {
      vi.mocked(generateMessageId).mockResolvedValue('message_id_456')
      vi.mocked(getParaEthTransferFees).mockResolvedValue([500n, 300n])
      vi.mocked(getAssetBalanceInternal).mockResolvedValue(5000n)
      vi.mocked(createCustomXcmOnDest).mockReturnValue([
        { instruction: 'test' }
      ] as unknown as ReturnType<typeof createCustomXcmOnDest>)

      await mythos.transferPolkadotXCM(mockEthereumInput)

      expect(mockApi.callTxMethod).toHaveBeenCalledWith(
        expect.objectContaining({
          module: 'PolkadotXcm',
          method: 'transfer_assets_using_type_and_then',
          parameters: expect.objectContaining({
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
    asset: {
      symbol: 'MYTH',
      amount: '1000',
      multiLocation: { parents: 0, interior: 'Here' },
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

  it('should throw InvalidCurrencyError when senderAddress is missing', async () => {
    const optionsWithoutSender = { ...mockOptions, senderAddress: undefined }

    await expect(
      createTypeAndThenTransfer(optionsWithoutSender, 'Mythos', Version.V4)
    ).rejects.toThrowError(
      new InvalidCurrencyError('Sender address is required for Mythos transfer')
    )
  })

  it('should throw InvalidCurrencyError for non-foreign assets', async () => {
    const optionsWithNonForeignAsset = {
      ...mockOptions,
      asset: { ...mockOptions.asset, assetId: undefined }
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

  it('should throw InvalidCurrencyError when insufficient balance', async () => {
    vi.mocked(generateMessageId).mockResolvedValue('message_id_123')
    vi.mocked(getParaEthTransferFees).mockResolvedValue([500n, 300n])
    vi.spyOn(mockApi, 'quoteAhPrice').mockResolvedValue(1000n)
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(500n) // Insufficient balance

    await expect(createTypeAndThenTransfer(mockOptions, 'Mythos', Version.V4)).rejects.toThrowError(
      InvalidCurrencyError
    )
  })

  it('should successfully create transfer call with sufficient balance', async () => {
    vi.mocked(generateMessageId).mockResolvedValue('message_id_123')
    vi.mocked(getParaEthTransferFees).mockResolvedValue([500n, 300n])
    vi.spyOn(mockApi, 'quoteAhPrice').mockResolvedValue(1000n)
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(5000n)
    vi.mocked(createCustomXcmOnDest).mockReturnValue([
      { instruction: 'test' }
    ] as unknown as ReturnType<typeof createCustomXcmOnDest>)

    const result = await createTypeAndThenTransfer(mockOptions, 'Mythos', Version.V4)

    expect(result).toEqual({
      module: 'PolkadotXcm',
      method: 'transfer_assets_using_type_and_then',
      parameters: expect.objectContaining({
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
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(5000n)
    vi.mocked(createCustomXcmOnDest).mockReturnValue([
      { instruction: 'test' }
    ] as unknown as ReturnType<typeof createCustomXcmOnDest>)

    await createTypeAndThenTransfer(mockOptions, 'Mythos', Version.V4)

    expect(generateMessageId).toHaveBeenCalledWith(
      mockApi,
      mockOptions.senderAddress,
      expect.any(Number), // paraId
      (mockOptions.asset as TForeignAsset).assetId,
      mockOptions.address,
      mockOptions.asset.amount
    )
    expect(mockApi.clone).toHaveBeenCalled()
    expect(mockApi.init).toHaveBeenCalledWith('AssetHubPolkadot')
    expect(getParaEthTransferFees).toHaveBeenCalledWith(mockApi)
    expect(getAssetBalanceInternal).toHaveBeenCalledWith({
      api: mockOptions.api,
      address: mockOptions.senderAddress,
      node: 'Mythos',
      currency: mockOptions.currency
    })
    expect(createCustomXcmOnDest).toHaveBeenCalledWith(
      mockOptions,
      'Mythos',
      'message_id_123',
      expect.any(BigInt)
    )
  })

  it('should handle different asset amounts correctly', async () => {
    const largeAmountOptions = {
      ...mockOptions,
      asset: { ...mockOptions.asset, amount: '999999999999' }
    }

    vi.mocked(generateMessageId).mockResolvedValue('message_id_large')
    vi.mocked(getParaEthTransferFees).mockResolvedValue([500n, 300n])
    vi.spyOn(mockApi, 'quoteAhPrice').mockResolvedValue(2000n)
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(50000n)
    vi.mocked(createCustomXcmOnDest).mockReturnValue([
      { instruction: 'test' }
    ] as unknown as ReturnType<typeof createCustomXcmOnDest>)

    const result = await createTypeAndThenTransfer(largeAmountOptions, 'Mythos', Version.V4)

    expect((result as any).parameters.assets[Version.V4]).toHaveLength(2)
    expect((result as any).parameters.assets[Version.V4][1]).toEqual(
      expect.objectContaining({
        id: mockOptions.asset.multiLocation,
        fun: { Fungible: '999999999999' }
      })
    )
  })
})

import type { TAssetInfo } from '@paraspell/assets'
import { findAssetInfoOrThrow } from '@paraspell/assets'
import { Parents, Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import { getParaEthTransferFees } from '../../transfer'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { getChain } from '../../utils'
import { createCustomXcmOnDest } from '../../utils/ethereum/createCustomXcmOnDest'
import { generateMessageId } from '../../utils/ethereum/generateMessageId'
import { getMythosOriginFee } from '../../utils/fees/getMythosOriginFee'
import { handleToAhTeleport } from '../../utils/transfer'
import type Mythos from './Mythos'
import { createTypeAndThenTransfer } from './Mythos'

vi.mock('@paraspell/assets', async importActual => ({
  ...(await importActual()),
  findAssetInfoOrThrow: vi.fn()
}))

vi.mock('../../pallets/polkadotXcm')
vi.mock('../../utils/transfer')
vi.mock('../../transfer')
vi.mock('../../utils/ethereum/generateMessageId')
vi.mock('../../utils/ethereum/createCustomXcmOnDest')
vi.mock('../../utils/fees/getMythosOriginFee')

const ethAsset: TAssetInfo = {
  symbol: 'MYTH',
  decimals: 12,
  assetId: '0x123',
  location: { parents: 2, interior: { X2: [] } }
}

describe('Mythos', () => {
  let mythos: Mythos<unknown, unknown, unknown>
  const mockInput = {
    assetInfo: { symbol: 'MYTH', amount: 100n },
    scenario: 'ParaToPara',
    destination: 'Acala'
  } as TPolkadotXCMTransferOptions<unknown, unknown, unknown>

  beforeEach(() => {
    vi.clearAllMocks()
    mythos = getChain<unknown, unknown, unknown, 'Mythos'>('Mythos')
    vi.mocked(findAssetInfoOrThrow).mockReturnValue(ethAsset)
  })

  it('should initialize with correct values', () => {
    expect(mythos.chain).toBe('Mythos')
    expect(mythos.info).toBe('mythos')
    expect(mythos.ecosystem).toBe('Polkadot')
    expect(mythos.version).toBe(Version.V5)
  })

  it('should call transferPolkadotXCM for non-AssetHubPolkadot destination', async () => {
    vi.spyOn(mythos, 'getNativeAssetSymbol').mockReturnValue('MYTH')
    await mythos.transferPolkadotXCM(mockInput)
    expect(transferPolkadotXcm).toHaveBeenCalledWith(mockInput)
  })

  it('should call transferPolkadotXCM for AssetHubPolkadot destination', async () => {
    vi.spyOn(mythos, 'getNativeAssetSymbol').mockReturnValue('MYTH')

    await mythos.transferPolkadotXCM({ ...mockInput, destination: 'AssetHubPolkadot' })

    expect(transferPolkadotXcm).toHaveBeenCalledWith({
      ...mockInput,
      destination: 'AssetHubPolkadot'
    })
  })

  it('should throw ScenarioNotSupportedError for unsupported scenario', async () => {
    const invalidInput = { ...mockInput, scenario: 'ParaToRelay' } as TPolkadotXCMTransferOptions<
      unknown,
      unknown,
      unknown
    >

    await expect(mythos.transferPolkadotXCM(invalidInput)).rejects.toThrow(
      ScenarioNotSupportedError
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

  it('should return false for isRelayToParaEnabled', () => {
    expect(mythos.isRelayToParaEnabled()).toBe(false)
  })

  describe('Ethereum transfers', () => {
    const mockApi = {
      clone: vi.fn(),
      init: vi.fn(),
      quoteAhPrice: vi.fn(),
      deserializeExtrinsics: vi.fn()
    } as unknown as IPolkadotApi<unknown, unknown, unknown>

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
    } as TPolkadotXCMTransferOptions<unknown, unknown, unknown>

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

      const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

      const result = await mythos.transferPolkadotXCM(mockEthereumInput)

      expect(generateMessageId).toHaveBeenCalledWith(
        mockApi,
        mockEthereumInput.senderAddress,
        expect.any(Number),
        ethAsset.assetId,
        mockEthereumInput.address,
        100n
      )
      expect(spy).toHaveBeenCalled()
      expect(result).toBe('ethereum_tx_result')
    })

    it('should call createTypeAndThenTransfer for Ethereum destination', async () => {
      vi.mocked(generateMessageId).mockResolvedValue('message_id_456')
      vi.mocked(getParaEthTransferFees).mockResolvedValue([500n, 300n])
      vi.mocked(createCustomXcmOnDest).mockReturnValue([
        { instruction: 'test' }
      ] as unknown as ReturnType<typeof createCustomXcmOnDest>)

      const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

      await mythos.transferPolkadotXCM(mockEthereumInput)

      expect(spy).toHaveBeenCalledWith(
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
  const mockApi = {} as unknown as IPolkadotApi<unknown, unknown, unknown>

  const mockOptions = {
    api: mockApi,
    scenario: 'ParaToPara',
    assetInfo: {
      symbol: 'MYTH',
      amount: 1000n,
      location: { parents: 0, interior: 'Here' }
    },
    currency: { symbol: 'MYTH' },
    senderAddress: '0x1234567890123456789012345678901234567890',
    address: '0x0987654321098765432109876543210987654321',
    destination: 'Ethereum'
  } as TPolkadotXCMTransferOptions<unknown, unknown, unknown>

  const ORIGIN_FEE = 200n

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(findAssetInfoOrThrow).mockReturnValue(ethAsset)
    vi.mocked(getMythosOriginFee).mockResolvedValue(ORIGIN_FEE)
  })

  it('should successfully create transfer call with sufficient balance', async () => {
    vi.mocked(generateMessageId).mockResolvedValue('message_id_123')
    vi.mocked(getParaEthTransferFees).mockResolvedValue([500n, 300n])
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
    vi.mocked(createCustomXcmOnDest).mockReturnValue([
      { instruction: 'test' }
    ] as unknown as ReturnType<typeof createCustomXcmOnDest>)

    await createTypeAndThenTransfer(mockOptions, 'Mythos', Version.V4)

    expect(generateMessageId).toHaveBeenCalledWith(
      mockApi,
      mockOptions.senderAddress,
      expect.any(Number), // paraId
      ethAsset.assetId,
      mockOptions.address,
      mockOptions.assetInfo.amount
    )
    expect(createCustomXcmOnDest).toHaveBeenCalledWith(
      mockOptions,
      'Mythos',
      'message_id_123',
      ethAsset
    )
  })

  it('should handle different asset amounts correctly', async () => {
    const largeAmountOptions = {
      ...mockOptions,
      assetInfo: { ...mockOptions.assetInfo, amount: 999999999999n }
    }

    vi.mocked(generateMessageId).mockResolvedValue('message_id_large')
    vi.mocked(getParaEthTransferFees).mockResolvedValue([500n, 300n])
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
              id: {
                parents: Parents.ZERO,
                interior: 'Here'
              },
              fun: { Fungible: ORIGIN_FEE }
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

import type {
  PolkadotApi,
  TAssetInfo,
  TCurrencyInputWithAmount,
  TEvmTransferOptions
} from '@paraspell/sdk-core'
import {
  abstractDecimals,
  BridgeHaltedError,
  createCustomXcmOnDest,
  findAssetInfoOrThrow,
  getBridgeStatus,
  getParaEthTransferFees,
  getParaId,
  isOverrideLocationSpecifier,
  MissingParameterError,
  Version
} from '@paraspell/sdk-core'
import type { Address } from 'viem'
import { getContract, type WalletClient } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { transferMoonbeamToEth } from './transferMoonbeamToEth'

vi.mock('@paraspell/sdk-core', async importOriginal => ({
  ...(await importOriginal()),
  abstractDecimals: vi.fn(),
  assertHasId: vi.fn(),
  assertSender: vi.fn(),
  createCustomXcmOnDest: vi.fn(),
  findAssetInfoOrThrow: vi.fn(),
  generateMessageId: vi.fn(),
  getBridgeStatus: vi.fn(),
  getParaEthTransferFees: vi.fn(),
  getParaId: vi.fn(),
  isOverrideLocationSpecifier: vi.fn()
}))

vi.mock('viem', () => ({
  http: vi.fn(),
  parseUnits: vi.fn(),
  formatUnits: vi.fn(),
  createPublicClient: vi.fn(),
  getContract: vi.fn().mockImplementation(() => ({
    write: {
      transferAssetsUsingTypeAndThenAddress: vi.fn(() => '0xviemHash')
    }
  }))
}))

describe('transferMoonbeamToEth', () => {
  const mockApi = {
    init: vi.fn(),
    clone: vi.fn(),
    objectToHex: vi.fn().mockResolvedValue('0xmockedXcm'),
    createApiForChain: vi.fn().mockResolvedValue({})
  } as unknown as PolkadotApi<unknown, unknown, unknown>

  const moonbeamAsset: TAssetInfo = {
    symbol: 'WETH',
    decimals: 18,
    assetId: '0xmockedAssetId',
    location: { parents: 2, interior: 'Here' }
  }

  const ethereumAsset: TAssetInfo = {
    symbol: 'WETH',
    decimals: 18,
    assetId: '0xethAssetId',
    location: { parents: 0, interior: 'Here' }
  }

  const from = 'Moonbeam' as const

  const signer = {
    chain: {},
    account: { address: '0xviem' as Address }
  } as WalletClient

  const baseOptions: TEvmTransferOptions<unknown, unknown, unknown> = {
    api: mockApi,
    from,
    to: 'Ethereum',
    recipient: '0xmockedAddress',
    ahAddress: '0xmockedAhAddress',
    currency: { symbol: 'WETH', amount: 1000 },
    signer
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(findAssetInfoOrThrow).mockImplementation(chain => {
      if (chain === 'Ethereum') return ethereumAsset
      return moonbeamAsset
    })
    vi.mocked(isOverrideLocationSpecifier).mockReturnValue(false)
    vi.mocked(abstractDecimals).mockImplementation(amount => BigInt(amount))
    vi.mocked(getParaId).mockReturnValue(1000)
    vi.mocked(getParaEthTransferFees).mockResolvedValue([1000n, 1000n])
    vi.mocked(getBridgeStatus).mockResolvedValue('Normal')
    vi.mocked(createCustomXcmOnDest).mockReturnValue({ [Version.V4]: [] })
  })

  it('should throw error for missing AssetHub address', async () => {
    await expect(
      transferMoonbeamToEth(from, {
        ...baseOptions,
        ahAddress: undefined
      })
    ).rejects.toThrow(MissingParameterError)
  })

  it('should throw error for multiple currencies', async () => {
    await expect(
      transferMoonbeamToEth(from, {
        ...baseOptions,
        currency: [] as TCurrencyInputWithAmount
      })
    ).rejects.toThrow('Multi-assets are not yet supported for EVM transfers')
  })

  it('should throw error for override location', async () => {
    vi.mocked(isOverrideLocationSpecifier).mockReturnValue(true)
    await expect(
      transferMoonbeamToEth(from, {
        ...baseOptions,
        currency: {
          location: { type: 'Override' }
        } as TCurrencyInputWithAmount
      })
    ).rejects.toThrow('Override location is not supported for EVM transfers')
  })

  it('should throw error when Ethereum asset not found', async () => {
    vi.mocked(findAssetInfoOrThrow)
      .mockImplementationOnce(() => moonbeamAsset)
      .mockImplementationOnce(() => {
        throw new Error('Asset {"symbol":"WETH"} not found on Ethereum')
      })

    await expect(transferMoonbeamToEth(from, baseOptions)).rejects.toThrow(
      'Asset {"symbol":"WETH"} not found on Ethereum'
    )
  })

  describe('successful transfers', () => {
    it('should work with viem signer', async () => {
      const result = await transferMoonbeamToEth(from, baseOptions)

      expect(result).toBe('0xviemHash')
      expect(getContract).toHaveBeenCalled()
      expect(getParaId).toHaveBeenCalledWith('AssetHubPolkadot')
      expect(getParaEthTransferFees).toHaveBeenCalled()
    })
  })

  it('should throw BridgeHaltedError when bridge status is not normal', async () => {
    vi.mocked(getBridgeStatus).mockResolvedValue('Halted')
    await expect(transferMoonbeamToEth(from, baseOptions)).rejects.toThrow(BridgeHaltedError)
  })
})

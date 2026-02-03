import type { TCurrencyInputWithAmount } from '@paraspell/assets'
import { findAssetInfoOrThrow, isOverrideLocationSpecifier } from '@paraspell/assets'
import type { TLocation, TSubstrateChain } from '@paraspell/sdk-common'
import type { WalletClient } from 'viem'
import { getContract } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getParaId } from '../../../chains/config'
import { BridgeHaltedError, MissingParameterError } from '../../../errors'
import type { TEvmBuilderOptions } from '../../../types'
import { abstractDecimals } from '../../../utils'
import { getBridgeStatus } from '../../getBridgeStatus'
import { getParaEthTransferFees } from '../getParaEthTransferFees'
import { transferMoonbeamToEth } from './transferMoonbeamToEth'

vi.mock('@paraspell/assets')

vi.mock('../../getBridgeStatus', () => ({
  getBridgeStatus: vi.fn().mockResolvedValue('Normal')
}))

vi.mock('../../../chains/config', () => ({
  getParaId: vi.fn(() => 1000)
}))

vi.mock('../getParaEthTransferFees', () => ({
  getParaEthTransferFees: vi.fn(() => [1000n, 1000n])
}))

vi.mock('../../../utils')

vi.mock('../../../utils/ethereum/createCustomXcmOnDest', () => ({
  createCustomXcmOnDest: vi.fn(() => '0xmockedXcm')
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
    getApi: vi.fn(() => ({
      query: {
        parachainInfo: {
          parachainId: vi.fn(() => ({
            toU8a: () => new Uint8Array([1, 2, 3])
          }))
        }
      },
      rpc: {
        system: {
          accountNextIndex: vi.fn(() => ({
            toU8a: () => new Uint8Array([4, 5, 6])
          }))
        }
      },
      createType: vi.fn(() => ({
        toU8a: () => new Uint8Array([7, 8, 9])
      }))
    })),
    getFromRpc: vi.fn(),
    accountToHex: vi.fn(),
    stringToUint8a: vi.fn().mockReturnValue(new Uint8Array([10, 11, 12])),
    hexToUint8a: vi.fn().mockReturnValue(new Uint8Array([13, 14, 15])),
    blake2AsHex: vi.fn().mockReturnValue('0xmockedHash'),
    objectToHex: vi.fn().mockReturnValue('0xmockedXcm'),
    createApiForChain: vi.fn(() => ({
      getApi: vi.fn(() => ({
        createType: vi.fn(() => ({
          toHex: () => '0xmockedXcm',
          toU8a: () => new Uint8Array([1, 2, 3])
        }))
      }))
    }))
  }

  const moonbeamAsset = {
    symbol: 'WETH',
    decimals: 18,
    location: { valid: 'location' } as unknown as TLocation,
    assetId: '0xmockedAssetId'
  }

  const ethereumAsset = {
    symbol: 'WETH',
    decimals: 18,
    assetId: '0xethAssetId'
  }

  const from: TSubstrateChain = 'Moonbeam'

  const baseOptions = {
    api: mockApi,
    from,
    to: 'Ethereum',
    address: '0xmockedAddress',
    ahAddress: '0xmockedAhAddress',
    currency: { symbol: 'WETH', amount: 1000 }
  } as unknown as TEvmBuilderOptions<unknown, unknown, unknown>

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(findAssetInfoOrThrow).mockImplementation(chain => {
      if (chain === 'Ethereum') return ethereumAsset
      return moonbeamAsset
    })
    vi.mocked(isOverrideLocationSpecifier).mockReturnValue(false)
    vi.mocked(abstractDecimals).mockImplementation(amount => BigInt(amount))
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
        currency: [] as unknown as TCurrencyInputWithAmount
      })
    ).rejects.toThrow('Multi-assets are not yet supported for EVM transfers')
  })

  it('should throw error for override location', async () => {
    vi.mocked(isOverrideLocationSpecifier).mockReturnValue(true)
    await expect(
      transferMoonbeamToEth(from, {
        ...baseOptions,
        currency: { location: { type: 'override' } } as unknown as TCurrencyInputWithAmount
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
      const result = await transferMoonbeamToEth(from, {
        ...baseOptions,
        signer: { chain: {}, account: { address: '0xviem' } } as unknown as WalletClient
      })

      expect(result).toBe('0xviemHash')
      expect(getContract).toHaveBeenCalled()
      expect(getParaId).toHaveBeenCalledWith('AssetHubPolkadot')
      expect(getParaEthTransferFees).toHaveBeenCalled()
    })
  })

  it('should handle messageId generation correctly', async () => {
    await transferMoonbeamToEth(from, {
      ...baseOptions,
      signer: { chain: {}, account: { address: '0xviem' } } as unknown as WalletClient
    })
  })

  it('should construct XCM parameters correctly', async () => {
    await transferMoonbeamToEth(from, {
      ...baseOptions,
      signer: { chain: {}, account: { address: '0xviem' } } as unknown as WalletClient
    })
  })

  it('should throw BridgeHaltedError when bridge status is not normal', async () => {
    vi.mocked(getBridgeStatus).mockResolvedValue('Halted')
    await expect(
      transferMoonbeamToEth(from, {
        ...baseOptions,
        signer: { chain: {}, account: { address: '0xviem' } } as unknown as WalletClient
      })
    ).rejects.toThrow(BridgeHaltedError)
  })
})

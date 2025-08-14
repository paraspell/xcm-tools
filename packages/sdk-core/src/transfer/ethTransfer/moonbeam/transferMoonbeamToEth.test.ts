import type { TCurrencyInputWithAmount } from '@paraspell/assets'
import {
  findAssetInfoByLoc,
  findAssetInfoOrThrow,
  isForeignAsset,
  isOverrideLocationSpecifier
} from '@paraspell/assets'
import type { TLocation } from '@paraspell/sdk-common'
import type { WalletClient } from 'viem'
import { getContract } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getParaId } from '../../../chains/config'
import { BridgeHaltedError } from '../../../errors'
import type { TEvmBuilderOptions } from '../../../types'
import { abstractDecimals } from '../../../utils'
import { getBridgeStatus } from '../../getBridgeStatus'
import { getParaEthTransferFees } from '../getParaEthTransferFees'
import { transferMoonbeamToEth } from './transferMoonbeamToEth'

vi.mock('@paraspell/assets', () => ({
  findAssetInfoByLoc: vi.fn(),
  findAssetInfoOrThrow: vi.fn(),
  getOtherAssets: vi.fn(() => [{ assetId: '0xethAssetId' }]),
  isForeignAsset: vi.fn(),
  isOverrideLocationSpecifier: vi.fn(),
  InvalidCurrencyError: class extends Error {}
}))

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

  const baseOptions = {
    api: mockApi,
    from: 'Moonbeam',
    to: 'Ethereum',
    address: '0xmockedAddress',
    ahAddress: '0xmockedAhAddress',
    currency: { amount: 1000 }
  } as unknown as TEvmBuilderOptions<unknown, unknown>

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({
      symbol: '',
      decimals: 18,
      location: { valid: 'location' } as unknown as TLocation,
      assetId: '0xmockedAssetId'
    })
    vi.mocked(findAssetInfoByLoc).mockReturnValue({
      symbol: '',
      assetId: '0xethAssetId',
      decimals: 18
    })
    vi.mocked(isForeignAsset).mockReturnValue(true)
    vi.mocked(isOverrideLocationSpecifier).mockReturnValue(false)
    vi.mocked(abstractDecimals).mockImplementation(amount => BigInt(amount))
  })

  it('should throw error for missing AssetHub address', async () => {
    await expect(
      transferMoonbeamToEth({
        ...baseOptions,
        ahAddress: undefined
      })
    ).rejects.toThrow('AssetHub address is required')
  })

  it('should throw error for multiple currencies', async () => {
    await expect(
      transferMoonbeamToEth({
        ...baseOptions,
        currency: [] as unknown as TCurrencyInputWithAmount
      })
    ).rejects.toThrow('Multi-assets are not yet supported')
  })

  it('should throw error for override location', async () => {
    vi.mocked(isOverrideLocationSpecifier).mockReturnValue(true)
    await expect(
      transferMoonbeamToEth({
        ...baseOptions,
        currency: { location: { type: 'override' } } as unknown as TCurrencyInputWithAmount
      })
    ).rejects.toThrow('Override location is not supported')
  })

  it('should throw error for non-foreign asset', async () => {
    vi.mocked(isForeignAsset).mockReturnValue(false)
    await expect(transferMoonbeamToEth(baseOptions)).rejects.toThrow(
      'Currency must be a foreign asset'
    )
  })

  it('should throw error when Ethereum asset not found', async () => {
    vi.mocked(findAssetInfoByLoc).mockReturnValue(undefined)
    await expect(transferMoonbeamToEth(baseOptions)).rejects.toThrow(
      'Could not obtain Ethereum asset address'
    )
  })

  describe('successful transfers', () => {
    it('should work with viem signer', async () => {
      const result = await transferMoonbeamToEth({
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
    await transferMoonbeamToEth({
      ...baseOptions,
      signer: { chain: {}, account: { address: '0xviem' } } as unknown as WalletClient
    })
  })

  it('should construct XCM parameters correctly', async () => {
    await transferMoonbeamToEth({
      ...baseOptions,
      signer: { chain: {}, account: { address: '0xviem' } } as unknown as WalletClient
    })
  })

  it('should throw BridgeHaltedError when bridge status is not normal', async () => {
    vi.mocked(getBridgeStatus).mockResolvedValue('Halted')
    await expect(
      transferMoonbeamToEth({
        ...baseOptions,
        signer: { chain: {}, account: { address: '0xviem' } } as unknown as WalletClient
      })
    ).rejects.toThrow(BridgeHaltedError)
  })
})

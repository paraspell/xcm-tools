/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TEvmBuilderOptions } from '@paraspell/sdk-core'
import {
  getAssetBySymbolOrId,
  findAssetByMultiLocation,
  calculateFee,
  InvalidCurrencyError,
  isForeignAsset,
  isOverrideMultiLocationSpecifier,
  getParaId
} from '@paraspell/sdk-core'
import { Contract } from 'ethers'
import { getContract } from 'viem'
import { blake2AsHex } from '@polkadot/util-crypto'
import { transferMoonbeamToEth } from './transferMoonbeamToEth'
import { isEthersContract, isEthersSigner } from './utils'

vi.mock('@polkadot/util-crypto', () => ({
  blake2AsHex: vi.fn(() => '0xmockedHash'),
  decodeAddress: vi.fn(() => new Uint8Array([1, 2, 3]))
}))

vi.mock('@polkadot/util', () => ({
  numberToHex: vi.fn((n: number) => `0x${n.toString(16)}`),
  u8aToHex: vi.fn(() => '0xmockedAddress')
}))

vi.mock('@paraspell/sdk-core', async () => {
  const actual = await vi.importActual('@paraspell/sdk-core')
  return {
    ...actual,
    calculateFee: vi.fn(() => 1000n),
    getAssetBySymbolOrId: vi.fn(),
    findAssetByMultiLocation: vi.fn(),
    getParaId: vi.fn(() => 1000),
    isForeignAsset: vi.fn(),
    isOverrideMultiLocationSpecifier: vi.fn(),
    InvalidCurrencyError: class extends Error {}
  }
})

vi.mock('ethers', () => ({
  Contract: vi.fn().mockImplementation(() => ({
    'transferAssetsUsingTypeAndThenAddress((uint8,bytes[]),(address,uint256)[],uint8,uint8,uint8,bytes)':
      vi.fn(() => ({
        hash: '0xethersHash'
      }))
  }))
}))

vi.mock('viem', () => ({
  createPublicClient: vi.fn(),
  getContract: vi.fn().mockImplementation(() => ({
    write: {
      transferAssetsUsingTypeAndThenAddress: vi.fn(() => '0xviemHash')
    }
  })),
  http: vi.fn()
}))

vi.mock('./utils', () => ({
  isEthersSigner: vi.fn(),
  isEthersContract: vi.fn()
}))

describe('transferMoonbeamToEth', () => {
  const mockApi = {
    init: vi.fn(),
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
    createApiForNode: vi.fn(() => ({
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
    vi.mocked(getAssetBySymbolOrId).mockReturnValue({
      symbol: '',
      multiLocation: { valid: 'location' },
      assetId: '0xmockedAssetId'
    })
    vi.mocked(findAssetByMultiLocation).mockReturnValue({ symbol: '', assetId: '0xethAssetId' })
    vi.mocked(isForeignAsset).mockReturnValue(true)
    vi.mocked(isOverrideMultiLocationSpecifier).mockReturnValue(false)
  })

  it('should throw error for multiasset currency', async () => {
    await expect(
      transferMoonbeamToEth({
        ...baseOptions,
        currency: { multiasset: 'invalid' } as any
      })
    ).rejects.toThrow('Multiassets syntax is not supported')
  })

  it('should throw error for override multilocation', async () => {
    vi.mocked(isOverrideMultiLocationSpecifier).mockReturnValue(true)
    await expect(
      transferMoonbeamToEth({
        ...baseOptions,
        currency: { multilocation: { type: 'override' } } as any
      })
    ).rejects.toThrow('Override multilocation is not supported')
  })

  it('should throw InvalidCurrencyError when asset not found', async () => {
    vi.mocked(getAssetBySymbolOrId).mockReturnValue(null)
    await expect(transferMoonbeamToEth(baseOptions)).rejects.toThrow(InvalidCurrencyError)
  })

  it('should throw error for non-foreign asset', async () => {
    vi.mocked(isForeignAsset).mockReturnValue(false)
    await expect(transferMoonbeamToEth(baseOptions)).rejects.toThrow(
      'Currency must be a foreign asset'
    )
  })

  it('should throw error when Ethereum asset not found', async () => {
    vi.mocked(findAssetByMultiLocation).mockReturnValue(undefined)
    await expect(transferMoonbeamToEth(baseOptions)).rejects.toThrow(
      'Could not obtain Ethereum asset address'
    )
  })

  describe('successful transfers', () => {
    it('should work with viem signer', async () => {
      const result = await transferMoonbeamToEth({
        ...baseOptions,
        signer: { chain: {}, account: { address: '0xviem' } } as any
      })

      expect(result).toBe('0xviemHash')
      expect(getContract).toHaveBeenCalled()
      expect(getParaId).toHaveBeenCalledWith('AssetHubPolkadot')
      expect(calculateFee).toHaveBeenCalled()
    })

    it('should work with ethers signer', async () => {
      vi.mocked(isEthersSigner).mockReturnValue(true)
      vi.mocked(isEthersContract).mockReturnValue(true)

      const result = await transferMoonbeamToEth({
        ...baseOptions,
        signer: { getAddress: () => '0xethers' } as any
      })

      expect(result).toBe('0xethersHash')
      expect(Contract).toHaveBeenCalled()
      expect(blake2AsHex).toHaveBeenCalled()
    })
  })

  it('should handle messageId generation correctly', async () => {
    vi.mocked(isEthersSigner).mockReturnValue(false)
    vi.mocked(isEthersContract).mockReturnValue(false)
    await transferMoonbeamToEth({
      ...baseOptions,
      signer: { chain: {}, getAddres: () => ({ address: '' }) } as any
    })
    expect(blake2AsHex).toHaveBeenCalledWith(expect.any(Uint8Array))
  })

  it('should construct XCM parameters correctly', async () => {
    vi.mocked(isEthersSigner).mockReturnValue(false)
    vi.mocked(isEthersContract).mockReturnValue(false)
    await transferMoonbeamToEth({
      ...baseOptions,
      signer: { chain: {}, getAddres: () => ({ address: '' }) } as any
    })

    const expectedParams = [
      [1, ['0x00000000000000000000000000000000000000000000000000000000000003e8']],
      [
        ['0xFfFFfFff1FcaCBd218EDc0EbA20Fc2308C778080', 1000n],
        ['0xethAssetId', 1000]
      ],
      2,
      0,
      2,
      '0xmockedXcm'
    ]

    if (process.env.USE_ETHERS) {
      expect(Contract.prototype.transferAssetsUsingTypeAndThenAddress).toHaveBeenCalledWith(
        ...expectedParams
      )
    }
  })
})

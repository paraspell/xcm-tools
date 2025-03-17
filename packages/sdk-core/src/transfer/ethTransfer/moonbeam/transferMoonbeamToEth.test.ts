import type { TCurrencyInputWithAmount } from '@paraspell/assets'
import {
  findAsset,
  findAssetByMultiLocation,
  InvalidCurrencyError,
  isForeignAsset,
  isOverrideMultiLocationSpecifier
} from '@paraspell/assets'
import type { TMultiLocation } from '@paraspell/sdk-common'
import type { Signer } from 'ethers'
import { Contract } from 'ethers'
import type { WalletClient } from 'viem'
import { getContract } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getParaId } from '../../../nodes/config'
import type { TEvmBuilderOptions } from '../../../types'
import { getParaEthTransferFees } from '../getParaEthTransferFees'
import { isEthersContract, isEthersSigner } from '../utils'
import { transferMoonbeamToEth } from './transferMoonbeamToEth'

vi.mock('@paraspell/assets', () => ({
  findAssetByMultiLocation: vi.fn(),
  findAsset: vi.fn(),
  getOtherAssets: vi.fn(() => [{ assetId: '0xethAssetId' }]),
  isForeignAsset: vi.fn(),
  isOverrideMultiLocationSpecifier: vi.fn(),
  InvalidCurrencyError: class extends Error {}
}))

vi.mock('../../../nodes/config', () => ({
  getParaId: vi.fn(() => 1000)
}))

vi.mock('../getParaEthTransferFees', () => ({
  getParaEthTransferFees: vi.fn(() => [1000n, 1000n])
}))

vi.mock('../../../utils/ethereum/createCustomXcmOnDest', () => ({
  createCustomXcmOnDest: vi.fn(() => '0xmockedXcm')
}))

vi.mock('ethers', () => ({
  Contract: vi.fn().mockImplementation(() => ({
    'transferAssetsUsingTypeAndThenAddress((uint8,bytes[]),(address,uint256)[],uint8,uint8,uint8,bytes)':
      vi.fn(() => ({
        hash: '0xethersHash'
      }))
  })),
  isAddress: vi.fn().mockReturnValue(true)
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

vi.mock('../utils', () => ({
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
    getFromRpc: vi.fn(),
    accountToHex: vi.fn(),
    stringToUint8a: vi.fn().mockReturnValue(new Uint8Array([10, 11, 12])),
    hexToUint8a: vi.fn().mockReturnValue(new Uint8Array([13, 14, 15])),
    blake2AsHex: vi.fn().mockReturnValue('0xmockedHash'),
    objectToHex: vi.fn().mockReturnValue('0xmockedXcm'),
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
    vi.mocked(findAsset).mockReturnValue({
      symbol: '',
      multiLocation: { valid: 'location' } as unknown as TMultiLocation,
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
        currency: { multiasset: 'invalid' } as unknown as TCurrencyInputWithAmount
      })
    ).rejects.toThrow('Multiassets syntax is not supported')
  })

  it('should throw error for override multilocation', async () => {
    vi.mocked(isOverrideMultiLocationSpecifier).mockReturnValue(true)
    await expect(
      transferMoonbeamToEth({
        ...baseOptions,
        currency: { multilocation: { type: 'override' } } as unknown as TCurrencyInputWithAmount
      })
    ).rejects.toThrow('Override multilocation is not supported')
  })

  it('should throw InvalidCurrencyError when asset not found', async () => {
    vi.mocked(findAsset).mockReturnValue(null)
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
        signer: { chain: {}, account: { address: '0xviem' } } as unknown as WalletClient
      })

      expect(result).toBe('0xviemHash')
      expect(getContract).toHaveBeenCalled()
      expect(getParaId).toHaveBeenCalledWith('AssetHubPolkadot')
      expect(getParaEthTransferFees).toHaveBeenCalled()
    })

    it('should work with ethers signer', async () => {
      vi.mocked(isEthersSigner).mockReturnValue(true)
      vi.mocked(isEthersContract).mockReturnValue(true)

      const result = await transferMoonbeamToEth({
        ...baseOptions,
        signer: { getAddress: () => '0xethers' } as unknown as Signer
      })

      expect(result).toBe('0xethersHash')
      expect(Contract).toHaveBeenCalled()
    })
  })

  it('should handle messageId generation correctly', async () => {
    vi.mocked(isEthersSigner).mockReturnValue(true)
    vi.mocked(isEthersContract).mockReturnValue(true)
    await transferMoonbeamToEth({
      ...baseOptions,
      signer: { chain: {}, getAddress: () => ({ address: '' }) } as unknown as Signer
    })
  })

  it('should construct XCM parameters correctly', async () => {
    vi.mocked(isEthersSigner).mockReturnValue(true)
    vi.mocked(isEthersContract).mockReturnValue(true)
    await transferMoonbeamToEth({
      ...baseOptions,
      signer: { chain: {}, getAddress: () => '123' } as unknown as Signer
    })

    const expectedParams = [
      [1, ['0x00000000000000000000000000000000000000000000000000000000000003e8']],
      [
        ['0xFfFFfFff1FcaCBd218EDc0EbA20Fc2308C778080', 2000n],
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

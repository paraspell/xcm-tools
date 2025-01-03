import { describe, it, expect, vi } from 'vitest'
import { buildEthTransferOptions } from './buildEthTransferOptions'
import { createContext } from './createContext'
import type { Context } from '@snowbridge/api'
import { toPolkadot } from '@snowbridge/api'
import type { SendValidationResult } from '@snowbridge/api/dist/toPolkadot'
import type { TSerializeEthTransferOptions } from '@paraspell/sdk-core'
import {
  getAssetBySymbolOrId,
  getParaId,
  isOverrideMultiLocationSpecifier
} from '@paraspell/sdk-core'

vi.mock('./createContext', () => ({
  createContext: vi.fn()
}))

vi.mock('@paraspell/sdk-core', () => ({
  getParaId: vi.fn(),
  getAssetBySymbolOrId: vi.fn(),
  isForeignAsset: vi.fn().mockReturnValue(true),
  InvalidCurrencyError: class extends Error {},
  isOverrideMultiLocationSpecifier: vi.fn().mockReturnValue(false)
}))

vi.mock('@snowbridge/api', () => ({
  toPolkadot: {
    validateSend: vi.fn()
  }
}))

vi.mock('@snowbridge/api', async importOriginal => {
  const actual = await importOriginal<typeof import('@snowbridge/api')>()
  return {
    ...actual,
    toPolkadot: {
      validateSend: vi.fn()
    }
  }
})

vi.mock('./checkPlanFailure', () => ({
  checkPlanFailure: vi.fn()
}))

describe('buildEthTransferOptions', () => {
  it('successfully returns serialized eth transfer options', async () => {
    const mockAsset = { symbol: '', assetId: 'eth-asset-id' }
    vi.mocked(getAssetBySymbolOrId).mockReturnValue(mockAsset)
    vi.mocked(createContext).mockResolvedValue({
      config: {},
      ethereum: {},
      polkadot: {}
    } as Context)
    vi.mocked(getParaId).mockReturnValue(1000)
    vi.mocked(toPolkadot).validateSend.mockResolvedValue({
      success: {
        token: 'token123',
        destinationParaId: 1000,
        destinationFee: 500n,
        amount: 1000n
      }
    } as SendValidationResult)

    const options: TSerializeEthTransferOptions = {
      currency: { symbol: 'ETH', amount: '1000000' },
      from: 'Ethereum',
      to: 'AssetHubPolkadot',
      address: '0xSenderAddress',
      destAddress: '0xDestinationAddress'
    }

    const result = await buildEthTransferOptions(options)

    expect(result).toEqual({
      token: 'token123',
      destinationParaId: 1000,
      destinationFee: 500n,
      amount: 1000n
    })
  })

  it('throws an error if asset is not found', async () => {
    vi.mocked(getAssetBySymbolOrId).mockImplementation(() => {
      throw new Error('Asset not found')
    })

    const options: TSerializeEthTransferOptions = {
      currency: { symbol: 'ETH', amount: '1000000' },
      from: 'Ethereum',
      to: 'AssetHubPolkadot',
      address: '0xSenderAddress',
      destAddress: '0xDestinationAddress'
    }

    await expect(buildEthTransferOptions(options)).rejects.toThrow('Asset not found')
  })

  it('throws an error if validation fails', async () => {
    const mockAsset = { symbol: '', assetId: 'eth-asset-id' }
    vi.mocked(getAssetBySymbolOrId).mockReturnValue(mockAsset)
    vi.mocked(createContext).mockResolvedValue({
      config: {},
      ethereum: {},
      polkadot: {}
    } as Context)
    vi.mocked(getParaId).mockReturnValue(1000)
    vi.mocked(toPolkadot).validateSend.mockResolvedValue({
      failure: {
        errors: [{ message: 'Insufficient funds' }]
      }
    } as SendValidationResult)

    const options: TSerializeEthTransferOptions = {
      currency: { symbol: 'ETH', amount: '1000000' },
      from: 'Ethereum',
      to: 'AssetHubPolkadot',
      address: '0xSenderAddress',
      destAddress: '0xDestinationAddress'
    }

    await expect(buildEthTransferOptions(options)).rejects.toThrow('Failed to validate send')
  })

  it('throws an error if asset has no asset id', async () => {
    const mockAsset = { symbol: '' }
    vi.mocked(getAssetBySymbolOrId).mockReturnValue(mockAsset)

    const options: TSerializeEthTransferOptions = {
      currency: { symbol: 'ETH', amount: '1000000' },
      from: 'Ethereum',
      to: 'AssetHubPolkadot',
      address: '0xSenderAddress',
      destAddress: '0xDestinationAddress'
    }

    await expect(buildEthTransferOptions(options)).rejects.toThrow('Selected asset has no asset id')
  })

  it('throws if asset not found', async () => {
    vi.mocked(getAssetBySymbolOrId).mockReturnValue(null)

    const options: TSerializeEthTransferOptions = {
      currency: { symbol: 'ETH', amount: '1000000' },
      from: 'Ethereum',
      to: 'AssetHubPolkadot',
      address: '0xSenderAddress',
      destAddress: '0xDestinationAddress'
    }

    await expect(buildEthTransferOptions(options)).rejects.toThrow(
      'Origin node Ethereum does not support currency {"symbol":"ETH","amount":"1000000"}.'
    )
  })

  it('throws an error if currency is multiasset', async () => {
    const options: TSerializeEthTransferOptions = {
      currency: { multiasset: [] },
      from: 'Ethereum',
      to: 'AssetHubPolkadot',
      address: '0xSenderAddress',
      destAddress: '0xDestinationAddress'
    }

    await expect(buildEthTransferOptions(options)).rejects.toThrow(
      'Multiassets syntax is not supported for Evm transfers'
    )
  })

  it('throws an error if trying to override multilocation', async () => {
    vi.mocked(isOverrideMultiLocationSpecifier).mockReturnValue(true)
    const options: TSerializeEthTransferOptions = {
      currency: {
        multilocation: {
          type: 'Override',
          value: {
            parents: 1,
            interior: {}
          }
        },
        amount: 1000
      },
      from: 'Ethereum',
      to: 'AssetHubPolkadot',
      address: '0xSenderAddress',
      destAddress: '0xDestinationAddress'
    }

    await expect(buildEthTransferOptions(options)).rejects.toThrow(
      'Override multilocation is not supported for Evm transfers'
    )
  })
})

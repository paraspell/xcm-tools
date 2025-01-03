import { describe, it, expect, vi } from 'vitest'
import { createContext } from './createContext'
import type { Context } from '@snowbridge/api'
import { toPolkadot } from '@snowbridge/api'
import type { SendValidationResult } from '@snowbridge/api/dist/toPolkadot'
import { transferEthToPolkadot } from './ethTransfer'
import type { AbstractProvider, Signer } from 'ethers'
import type { WalletClient } from 'viem'
import type { IPolkadotApi, TEvmBuilderOptions } from '@paraspell/sdk-core'
import {
  getAssetBySymbolOrId,
  getParaId,
  isOverrideMultiLocationSpecifier
} from '@paraspell/sdk-core'
import type { Extrinsic, TPjsApi } from '../types'

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
      validateSend: vi.fn(),
      send: vi.fn()
    }
  }
})

vi.mock('./checkPlanFailure', () => ({
  checkPlanFailure: vi.fn()
}))

describe('transferEthToPolkadot', () => {
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
    vi.mocked(toPolkadot).send.mockResolvedValue({})

    const options: TEvmBuilderOptions<TPjsApi, Extrinsic> = {
      api: {} as IPolkadotApi<TPjsApi, Extrinsic>,
      provider: {} as AbstractProvider,
      currency: { symbol: 'ETH', amount: '1000000' },
      from: 'Ethereum',
      to: 'AssetHubPolkadot',
      address: '0xSenderAddress',
      signer: {
        provider: {}
      } as Signer
    }

    const result = await transferEthToPolkadot(options)

    expect(result).toEqual({
      result: {},
      plan: {
        success: {
          token: 'token123',
          destinationParaId: 1000,
          destinationFee: 500n,
          amount: 1000n
        }
      }
    })
  })

  it('throws error if provider is not provided', async () => {
    const options: TEvmBuilderOptions<TPjsApi, Extrinsic> = {
      api: {} as IPolkadotApi<TPjsApi, Extrinsic>,
      currency: { symbol: 'ETH', amount: '1000000' },
      from: 'Ethereum',
      to: 'AssetHubPolkadot',
      address: '0xSenderAddress',
      signer: {
        provider: {}
      } as Signer
    }

    await expect(transferEthToPolkadot(options)).rejects.toThrow(
      'provider parameter is required for Snowbridge transfers.'
    )
  })

  it('throws error if signer is not an ethers signer', async () => {
    const options: TEvmBuilderOptions<TPjsApi, Extrinsic> = {
      api: {} as IPolkadotApi<TPjsApi, Extrinsic>,
      provider: {} as AbstractProvider,
      currency: { symbol: 'ETH', amount: '1000000' },
      from: 'Ethereum',
      to: 'AssetHubPolkadot',
      address: '0xSenderAddress',
      signer: {
        otherProvider: {}
      } as unknown as WalletClient
    }

    await expect(transferEthToPolkadot(options)).rejects.toThrow(
      'Snowbridge does not support Viem provider yet.'
    )
  })

  it('throws error if asset is not found', async () => {
    vi.mocked(getAssetBySymbolOrId).mockReturnValue(null)

    const options: TEvmBuilderOptions<TPjsApi, Extrinsic> = {
      api: {} as IPolkadotApi<TPjsApi, Extrinsic>,
      provider: {} as AbstractProvider,
      currency: { symbol: 'ETH', amount: '1000000' },
      from: 'Ethereum',
      to: 'AssetHubPolkadot',
      address: '0xSenderAddress',
      signer: {
        provider: {}
      } as Signer
    }

    await expect(transferEthToPolkadot(options)).rejects.toThrow()
  })

  it('throws error if asset has no asset id', async () => {
    vi.mocked(getAssetBySymbolOrId).mockReturnValue({ symbol: '' })

    const options: TEvmBuilderOptions<TPjsApi, Extrinsic> = {
      api: {} as IPolkadotApi<TPjsApi, Extrinsic>,
      provider: {} as AbstractProvider,
      currency: { symbol: 'ETH', amount: '1000000' },
      from: 'Ethereum',
      to: 'AssetHubPolkadot',
      address: '0xSenderAddress',
      signer: {
        provider: {}
      } as Signer
    }

    await expect(transferEthToPolkadot(options)).rejects.toThrow('Selected asset has no asset id')
  })

  it('throws an error if currency is multiasset', async () => {
    const options: TEvmBuilderOptions<TPjsApi, Extrinsic> = {
      api: {} as IPolkadotApi<TPjsApi, Extrinsic>,
      provider: {} as AbstractProvider,
      currency: { multiasset: [] },
      from: 'Ethereum',
      to: 'AssetHubPolkadot',
      address: '0xSenderAddress',
      signer: {
        provider: {}
      } as Signer
    }

    await expect(transferEthToPolkadot(options)).rejects.toThrow(
      'Multiassets syntax is not supported for Evm transfers'
    )
  })

  it('throws an error if trying to override multilocation', async () => {
    vi.mocked(isOverrideMultiLocationSpecifier).mockReturnValue(true)
    const options: TEvmBuilderOptions<TPjsApi, Extrinsic> = {
      api: {} as IPolkadotApi<TPjsApi, Extrinsic>,
      provider: {} as AbstractProvider,
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
      signer: {
        provider: {}
      } as Signer
    }

    await expect(transferEthToPolkadot(options)).rejects.toThrow(
      'Override multilocation is not supported for Evm transfers'
    )
  })
})

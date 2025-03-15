/* eslint-disable @typescript-eslint/require-await */
import { beforeEach } from 'node:test'

import type { IPolkadotApi, TAsset, TEvmBuilderOptions } from '@paraspell/sdk-core'
import {
  findAsset,
  getParaId,
  isEthersSigner,
  isOverrideMultiLocationSpecifier
} from '@paraspell/sdk-core'
import { type Context, toPolkadotV2 } from '@snowbridge/api'
import type { ValidationResult } from '@snowbridge/api/dist/toPolkadot_v2'
import type { AbstractProvider, Signer } from 'ethers'
import type { WalletClient } from 'viem'
import { describe, expect, it, vi } from 'vitest'

import type { Extrinsic, TPjsApi } from '../types'
import { createContext } from './createContext'
import { transferEthToPolkadot } from './ethTransfer'

vi.mock('./createContext', () => ({
  createContext: vi.fn()
}))

vi.mock('@paraspell/sdk-core', () => ({
  getParaId: vi.fn(),
  findAsset: vi.fn(),
  isForeignAsset: vi.fn().mockReturnValue(true),
  InvalidCurrencyError: class extends Error {},
  isOverrideMultiLocationSpecifier: vi.fn().mockReturnValue(false),
  isEthersSigner: vi.fn()
}))

vi.mock('@snowbridge/api', async () => {
  const actual = await vi.importActual<typeof import('@snowbridge/api')>('@snowbridge/api')
  return {
    ...actual,
    toPolkadotV2: {
      ...actual.toPolkadotV2,
      getDeliveryFee: vi.fn().mockResolvedValue(100n),
      createTransfer: vi.fn().mockResolvedValue({
        tx: {}
      }),
      validateTransfer: vi.fn().mockResolvedValue({
        logs: []
      }),
      getMessageReceipt: vi.fn().mockResolvedValue({ some: 'receipt' })
    },
    assetsV2: {
      buildRegistry: vi.fn().mockImplementation(contextData => ({ contextData })),
      fromContext: vi.fn().mockResolvedValue({
        polkadot: () => ({}),
        ethereum: () => ({}),
        bridgeHub: async () => ({}),
        assetHub: async () => ({}),
        parachain: async () => ({})
      })
    }
  }
})

describe('transferEthToPolkadot', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('successfully returns tx response and message receipt', async () => {
    vi.mocked(findAsset).mockReturnValue({ symbol: 'Ethereum', assetId: 'eth-asset-id' })
    vi.mocked(getParaId).mockReturnValue(1000)
    vi.mocked(isEthersSigner).mockReturnValue(true)
    vi.mocked(createContext).mockReturnValue({
      config: {},
      ethereum: () => ({}),
      polkadot: () => ({}),
      gateway: () => ({}),
      bridgeHub: async () => ({}),
      assetHub: async () => ({}),
      parachain: async () => ({})
    } as unknown as Context)
    const fakeSigner = {
      provider: {},
      getAddress: vi.fn().mockResolvedValue('0xFakeAddress'),
      sendTransaction: vi.fn().mockResolvedValue({
        hash: '0xFakeHash',
        wait: vi.fn().mockResolvedValue({ hash: '0xFakeReceiptHash' })
      })
    } as unknown as Signer

    const options: TEvmBuilderOptions<TPjsApi, Extrinsic> = {
      api: {} as IPolkadotApi<TPjsApi, Extrinsic>,
      provider: {} as AbstractProvider,
      currency: { symbol: 'ETH', amount: '1000000' },
      from: 'Ethereum',
      to: 'AssetHubPolkadot',
      address: '0xSenderAddress',
      signer: fakeSigner
    }

    const result = await transferEthToPolkadot(options)

    expect(result).toEqual({
      response: {
        hash: '0xFakeHash',
        wait: expect.any(Function)
      },
      messageReceipt: { some: 'receipt' }
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

    vi.mocked(isEthersSigner).mockReturnValue(false)

    await expect(transferEthToPolkadot(options)).rejects.toThrow(
      'Snowbridge does not support Viem provider yet.'
    )
  })

  it('throws error if asset is not found', async () => {
    vi.mocked(findAsset).mockReturnValue(null)

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
    vi.mocked(isEthersSigner).mockReturnValue(true)
    vi.mocked(findAsset).mockReturnValue({ symbol: '' } as TAsset)

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

  it('throws error if message receipt is missing', async () => {
    vi.mocked(findAsset).mockReturnValue({ symbol: 'Ethereum', assetId: 'eth-asset-id' })
    vi.mocked(getParaId).mockReturnValue(1000)
    vi.mocked(isEthersSigner).mockReturnValue(true)
    vi.mocked(createContext).mockReturnValue({
      config: {},
      ethereum: () => ({}),
      polkadot: () => ({}),
      gateway: () => ({}),
      bridgeHub: async () => ({}),
      assetHub: async () => ({}),
      parachain: async () => ({})
    } as unknown as Context)

    vi.spyOn(toPolkadotV2, 'validateTransfer').mockResolvedValue({
      logs: []
    } as unknown as ValidationResult)

    vi.spyOn(toPolkadotV2, 'getMessageReceipt').mockResolvedValue(null)
    const fakeSigner = {
      provider: {},
      getAddress: vi.fn().mockResolvedValue('0xFakeAddress'),
      sendTransaction: vi.fn().mockResolvedValue({
        hash: '0xFakeHash',
        wait: vi.fn().mockResolvedValue({ hash: '0xFakeReceiptHash' })
      })
    } as unknown as Signer

    const options: TEvmBuilderOptions<TPjsApi, Extrinsic> = {
      api: {} as IPolkadotApi<TPjsApi, Extrinsic>,
      provider: {} as AbstractProvider,
      currency: { symbol: 'ETH', amount: '1000000' },
      from: 'Ethereum',
      to: 'AssetHubPolkadot',
      address: '0xSenderAddress',
      signer: fakeSigner
    }

    await expect(transferEthToPolkadot(options)).rejects.toThrow(
      /Transaction 0xFakeReceiptHash did not emit a message./
    )
  })

  it('throws error if transaction receipt is missing', async () => {
    vi.mocked(findAsset).mockReturnValue({ symbol: 'Ethereum', assetId: 'eth-asset-id' })
    vi.mocked(getParaId).mockReturnValue(1000)
    vi.mocked(createContext).mockReturnValue({
      config: {},
      ethereum: () => ({}),
      polkadot: () => ({}),
      gateway: () => ({}),
      bridgeHub: async () => ({}),
      assetHub: async () => ({}),
      parachain: async () => ({})
    } as unknown as Context)

    vi.spyOn(toPolkadotV2, 'validateTransfer').mockResolvedValue({
      logs: []
    } as unknown as ValidationResult)

    const fakeSigner = {
      provider: {},
      getAddress: vi.fn().mockResolvedValue('0xFakeAddress'),
      sendTransaction: vi.fn().mockResolvedValue({
        hash: '0xFakeHash',
        wait: vi.fn().mockResolvedValue(null)
      })
    } as unknown as Signer

    const options: TEvmBuilderOptions<TPjsApi, Extrinsic> = {
      api: {} as IPolkadotApi<TPjsApi, Extrinsic>,
      provider: {} as AbstractProvider,
      currency: { symbol: 'ETH', amount: '1000000' },
      from: 'Ethereum',
      to: 'AssetHubPolkadot',
      address: '0xSenderAddress',
      signer: fakeSigner
    }

    await expect(transferEthToPolkadot(options)).rejects.toThrow(
      /Transaction 0xFakeHash not included./
    )
  })

  it('throws error if validation fails', async () => {
    vi.mocked(findAsset).mockReturnValue({ symbol: 'Ethereum', assetId: 'eth-asset-id' })
    vi.mocked(getParaId).mockReturnValue(1000)
    vi.mocked(isEthersSigner).mockReturnValue(true)
    vi.mocked(createContext).mockReturnValue({
      config: {},
      ethereum: () => ({}),
      polkadot: () => ({}),
      gateway: () => ({}),
      bridgeHub: async () => ({}),
      assetHub: async () => ({}),
      parachain: async () => ({})
    } as unknown as Context)

    vi.spyOn(toPolkadotV2, 'validateTransfer').mockResolvedValue({
      logs: [{ kind: toPolkadotV2.ValidationKind.Error, message: 'Validation error occurred' }]
    } as unknown as ValidationResult)

    const fakeSigner = {
      provider: {},
      getAddress: vi.fn().mockResolvedValue('0xFakeAddress'),
      sendTransaction: vi.fn()
    } as unknown as Signer

    const options: TEvmBuilderOptions<TPjsApi, Extrinsic> = {
      api: {} as IPolkadotApi<TPjsApi, Extrinsic>,
      provider: {} as AbstractProvider,
      currency: { symbol: 'ETH', amount: '1000000' },
      from: 'Ethereum',
      to: 'AssetHubPolkadot',
      address: '0xSenderAddress',
      signer: fakeSigner
    }

    await expect(transferEthToPolkadot(options)).rejects.toThrow(
      /Validation failed with following errors: \n\n Validation error occurred/
    )
  })
})

import type { PolkadotApi, TAssetInfo } from '@paraspell/sdk-core'
import {
  findAssetInfoOrThrow,
  getParaId,
  isOverrideLocationSpecifier,
  MissingParameterError
} from '@paraspell/sdk-core'
import { SnowbridgeApi, toPolkadotV2 } from '@snowbridge/api'
import type { AbstractProvider, Signer } from 'ethers'
import type { WalletClient } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Extrinsic, TPjsApi, TPjsEvmBuilderOptions, TPjsSigner } from '../types'
import { isEthersSigner } from '../utils'
import { transferEthToPolkadot } from './ethTransfer'

vi.mock('@paraspell/sdk-core', async importOriginal => ({
  ...(await importOriginal()),
  getParaId: vi.fn(),
  findAssetInfoOrThrow: vi.fn(),
  InvalidCurrencyError: class extends Error {},
  isOverrideLocationSpecifier: vi.fn().mockReturnValue(false),
  abstractDecimals: vi.fn(),
  assertHasId: vi.fn(),
  MissingParameterError: class extends Error {},
  UnsupportedOperationError: class extends Error {},
  RoutingResolutionError: class extends Error {}
}))

vi.mock('../utils')

const senderMock = {
  fee: vi.fn(),
  tx: vi.fn(),
  validate: vi.fn(),
  messageId: vi.fn()
}

const setEthProviderMock = vi.fn()

vi.mock('@snowbridge/api', () => {
  const ValidationKind = { Warning: 0, Error: 1 }
  const SnowbridgeApi = vi.fn(
    class {
      context = { setEthProvider: setEthProviderMock, ethereum: () => ({}) }
      sender = vi.fn(() => senderMock)
    }
  )
  return {
    SnowbridgeApi,
    toPolkadotV2: { ValidationKind }
  }
})

vi.mock('@snowbridge/registry', () => ({
  bridgeInfoFor: vi.fn(() => ({
    environment: { name: 'polkadot_mainnet', ethChainId: 1, ethereumChains: {} },
    registry: {},
    routes: [],
    chains: {}
  }))
}))

vi.mock('@snowbridge/provider-ethers', () => ({
  EthersEthereumProvider: vi.fn(class {})
}))

describe('transferEthToPolkadot', () => {
  const ethAsset: TAssetInfo = {
    symbol: 'ETH',
    decimals: 18,
    assetId: 'eth-asset-id',
    location: { parents: 0, interior: 'Here' }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    senderMock.fee.mockResolvedValue(100n)
    senderMock.tx.mockResolvedValue({ tx: {} })
    senderMock.validate.mockResolvedValue({ logs: [] })
    senderMock.messageId.mockResolvedValue({ some: 'receipt' })
  })

  it('successfully returns tx response and message receipt', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue(ethAsset)
    vi.mocked(getParaId).mockReturnValue(1000)
    vi.mocked(isEthersSigner).mockReturnValue(true)
    const fakeSigner = {
      provider: {},
      getAddress: vi.fn().mockResolvedValue('0xFakeAddress'),
      sendTransaction: vi.fn().mockResolvedValue({
        hash: '0xFakeHash',
        wait: vi.fn().mockResolvedValue({ hash: '0xFakeReceiptHash' })
      })
    } as unknown as Signer

    const options: TPjsEvmBuilderOptions<TPjsApi, Extrinsic, TPjsSigner> = {
      api: {} as PolkadotApi<TPjsApi, Extrinsic, TPjsSigner>,
      provider: {} as AbstractProvider,
      currency: { symbol: 'ETH', amount: '1000000' },
      from: 'Ethereum',
      to: 'AssetHubPolkadot',
      recipient: '0xSenderAddress',
      signer: fakeSigner
    }

    const result = await transferEthToPolkadot(options)

    expect(SnowbridgeApi).toHaveBeenCalledOnce()
    expect(setEthProviderMock).toHaveBeenCalledWith(1, options.provider)
    expect(senderMock.fee).toHaveBeenCalledWith('eth-asset-id')
    expect(result).toEqual({
      response: {
        hash: '0xFakeHash',
        wait: expect.any(Function)
      },
      messageReceipt: { some: 'receipt' }
    })
  })

  it('throws error if provider is not provided', async () => {
    const options: TPjsEvmBuilderOptions<TPjsApi, Extrinsic, TPjsSigner> = {
      api: {} as PolkadotApi<TPjsApi, Extrinsic, TPjsSigner>,
      currency: { symbol: 'ETH', amount: '1000000' },
      from: 'Ethereum',
      to: 'AssetHubPolkadot',
      recipient: '0xSenderAddress',
      signer: {
        provider: {}
      } as Signer
    }

    await expect(transferEthToPolkadot(options)).rejects.toThrow(MissingParameterError)
  })

  it('throws error if signer is not an ethers signer', async () => {
    const options: TPjsEvmBuilderOptions<TPjsApi, Extrinsic, TPjsSigner> = {
      api: {} as PolkadotApi<TPjsApi, Extrinsic, TPjsSigner>,
      provider: {} as AbstractProvider,
      currency: { symbol: 'ETH', amount: '1000000' },
      from: 'Ethereum',
      to: 'AssetHubPolkadot',
      recipient: '0xSenderAddress',
      signer: {
        otherProvider: {}
      } as unknown as WalletClient
    }

    vi.mocked(isEthersSigner).mockReturnValue(false)

    await expect(transferEthToPolkadot(options)).rejects.toThrow(
      'Snowbridge does not support Viem provider yet.'
    )
  })

  it('throws an error if currency is multiasset', async () => {
    const options: TPjsEvmBuilderOptions<TPjsApi, Extrinsic, TPjsSigner> = {
      api: {} as PolkadotApi<TPjsApi, Extrinsic, TPjsSigner>,
      provider: {} as AbstractProvider,
      currency: [],
      from: 'Ethereum',
      to: 'AssetHubPolkadot',
      recipient: '0xSenderAddress',
      signer: {
        provider: {}
      } as Signer
    }

    await expect(transferEthToPolkadot(options)).rejects.toThrow(
      'Multi-assets are not yet supported for EVM transfers'
    )
  })

  it('throws an error if trying to override location', async () => {
    vi.mocked(isOverrideLocationSpecifier).mockReturnValue(true)
    const options: TPjsEvmBuilderOptions<TPjsApi, Extrinsic, TPjsSigner> = {
      api: {} as PolkadotApi<TPjsApi, Extrinsic, TPjsSigner>,
      provider: {} as AbstractProvider,
      currency: {
        location: {
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
      recipient: '0xSenderAddress',
      signer: {
        provider: {}
      } as Signer
    }

    await expect(transferEthToPolkadot(options)).rejects.toThrow(
      'Override location is not supported for EVM transfers'
    )
  })

  it('throws error if message receipt is missing', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue(ethAsset)
    vi.mocked(getParaId).mockReturnValue(1000)
    vi.mocked(isEthersSigner).mockReturnValue(true)

    senderMock.messageId.mockResolvedValue(null)

    const fakeSigner = {
      provider: {},
      getAddress: vi.fn().mockResolvedValue('0xFakeAddress'),
      sendTransaction: vi.fn().mockResolvedValue({
        hash: '0xFakeHash',
        wait: vi.fn().mockResolvedValue({ hash: '0xFakeReceiptHash' })
      })
    } as unknown as Signer

    const options: TPjsEvmBuilderOptions<TPjsApi, Extrinsic, TPjsSigner> = {
      api: {} as PolkadotApi<TPjsApi, Extrinsic, TPjsSigner>,
      provider: {} as AbstractProvider,
      currency: { symbol: 'ETH', amount: '1000000' },
      from: 'Ethereum',
      to: 'AssetHubPolkadot',
      recipient: '0xSenderAddress',
      signer: fakeSigner
    }

    await expect(transferEthToPolkadot(options)).rejects.toThrow(
      /Transaction 0xFakeReceiptHash did not emit a message./
    )
  })

  it('throws error if transaction receipt is missing', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue(ethAsset)
    vi.mocked(getParaId).mockReturnValue(1000)
    vi.mocked(isEthersSigner).mockReturnValue(true)

    const fakeSigner = {
      provider: {},
      getAddress: vi.fn().mockResolvedValue('0xFakeAddress'),
      sendTransaction: vi.fn().mockResolvedValue({
        hash: '0xFakeHash',
        wait: vi.fn().mockResolvedValue(null)
      })
    } as unknown as Signer

    const options: TPjsEvmBuilderOptions<TPjsApi, Extrinsic, TPjsSigner> = {
      api: {} as PolkadotApi<TPjsApi, Extrinsic, TPjsSigner>,
      provider: {} as AbstractProvider,
      currency: { symbol: 'ETH', amount: '1000000' },
      from: 'Ethereum',
      to: 'AssetHubPolkadot',
      recipient: '0xSenderAddress',
      signer: fakeSigner
    }

    await expect(transferEthToPolkadot(options)).rejects.toThrow(
      /Transaction 0xFakeHash not included./
    )
  })

  it('throws error if validation fails', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue(ethAsset)
    vi.mocked(getParaId).mockReturnValue(1000)
    vi.mocked(isEthersSigner).mockReturnValue(true)

    senderMock.validate.mockResolvedValue({
      logs: [{ kind: toPolkadotV2.ValidationKind.Error, message: 'Validation error occurred' }]
    })

    const fakeSigner = {
      provider: {},
      getAddress: vi.fn().mockResolvedValue('0xFakeAddress'),
      sendTransaction: vi.fn()
    } as unknown as Signer

    const options: TPjsEvmBuilderOptions<TPjsApi, Extrinsic, TPjsSigner> = {
      api: {} as PolkadotApi<TPjsApi, Extrinsic, TPjsSigner>,
      provider: {} as AbstractProvider,
      currency: { symbol: 'ETH', amount: '1000000' },
      from: 'Ethereum',
      to: 'AssetHubPolkadot',
      recipient: '0xSenderAddress',
      signer: fakeSigner
    }

    await expect(transferEthToPolkadot(options)).rejects.toThrow(
      /Validation failed with following errors: \n\n Validation error occurred/
    )
  })
})

import type { TAssetInfo, TBuildEvmTransferOptions } from '@paraspell/sdk-core'
import {
  abstractDecimals,
  assertHasId,
  DEFAULT_TTL_MS,
  findAssetInfoOrThrow,
  getParaId,
  RoutingResolutionError,
  ScenarioNotSupportedError,
  UnsupportedOperationError
} from '@paraspell/sdk-core'
import { SnowbridgeApi, toPolkadotV2 } from '@snowbridge/api'
import type { BridgeInfo } from '@snowbridge/base-types'
import { ViemEthereumProvider } from '@snowbridge/provider-viem'
import { bridgeInfoFor } from '@snowbridge/registry'
import type { PublicClient } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { buildSnowbridgeTransfer } from './buildSnowbridgeTransfer'
import { createEnvironment } from './createEnvironment'
import {
  ETHEREUM_TESTNET_WS_URLS,
  ETHEREUM_WS_URLS,
  leaseClient,
  releaseClient
} from './viemClientCache'

const { senderMethods, setEthProvider, senderFactory } = vi.hoisted(() => {
  const senderMethods = {
    fee: vi.fn(),
    tx: vi.fn(),
    validate: vi.fn(),
    messageId: vi.fn()
  }
  return {
    senderMethods,
    setEthProvider: vi.fn(),
    senderFactory: vi.fn(() => senderMethods)
  }
})

vi.mock('@paraspell/sdk-core', async importOriginal => ({
  ...(await importOriginal()),
  abstractDecimals: vi.fn(),
  assertHasId: vi.fn(),
  findAssetInfoOrThrow: vi.fn(),
  getParaId: vi.fn()
}))

vi.mock('@snowbridge/api', () => ({
  SnowbridgeApi: vi.fn(),
  toPolkadotV2: { ValidationKind: { Warning: 0, Error: 1 } }
}))

vi.mock('@snowbridge/provider-viem')
vi.mock('@snowbridge/registry')
vi.mock('./createEnvironment')
vi.mock('./viemClientCache', () => ({
  ETHEREUM_WS_URLS: ['wss://test-cache.example'],
  ETHEREUM_TESTNET_WS_URLS: ['wss://test-sepolia.example'],
  leaseClient: vi.fn(),
  releaseClient: vi.fn()
}))

const ASSET_ID = '0x2222222222222222222222222222222222222222'
const SOURCE = '0x3333333333333333333333333333333333333333'
const RECIPIENT = '0x4444444444444444444444444444444444444444'

const ethAsset: TAssetInfo = {
  symbol: 'WETH',
  decimals: 18,
  existentialDeposit: '1000',
  assetId: ASSET_ID,
  location: { parents: 0, interior: 'Here' }
}

const publicClient = {} as PublicClient

const baseOptions = (overrides: Partial<Parameters<typeof buildSnowbridgeTransfer>[0]> = {}) =>
  ({
    api: {},
    from: 'Ethereum',
    to: 'AssetHubPolkadot',
    currency: { symbol: 'WETH', amount: '1' },
    recipient: RECIPIENT,
    sender: SOURCE,
    ...overrides
  }) as TBuildEvmTransferOptions<unknown, unknown, unknown>

describe('buildSnowbridgeTransfer', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(SnowbridgeApi).mockImplementation(function (this: {
      context: { setEthProvider: typeof setEthProvider }
      sender: typeof senderFactory
    }) {
      this.context = { setEthProvider }
      this.sender = senderFactory
    } as unknown as typeof SnowbridgeApi)

    vi.mocked(findAssetInfoOrThrow).mockReturnValue(ethAsset)
    vi.mocked(abstractDecimals).mockReturnValue(1_000n)
    vi.mocked(getParaId).mockReturnValue(1000)

    vi.mocked(bridgeInfoFor).mockImplementation(env => {
      const chainIdByEnv: Record<string, number> = {
        polkadot_mainnet: 1,
        westend_sepolia: 11155111,
        paseo_sepolia: 11155112
      }
      return {
        environment: { ethChainId: chainIdByEnv[env] ?? 1 }
      } as unknown as BridgeInfo
    })
    vi.mocked(createEnvironment).mockImplementation(env => env)

    senderMethods.fee.mockResolvedValue({ fee: 10n })
    senderMethods.tx.mockResolvedValue({ tx: { to: '0xabc', data: '0x', value: 5n } })
    senderMethods.validate.mockResolvedValue({ logs: [] })

    vi.mocked(leaseClient).mockResolvedValue({} as PublicClient)
  })

  it('throws UnsupportedOperationError when currency is an array', async () => {
    await expect(
      buildSnowbridgeTransfer(baseOptions({ currency: [] }), publicClient)
    ).rejects.toThrow(UnsupportedOperationError)
  })

  it('returns prepared tx and Snowbridge sender on success', async () => {
    const result = await buildSnowbridgeTransfer(baseOptions(), publicClient)

    expect(bridgeInfoFor).toHaveBeenCalledWith('polkadot_mainnet')
    expect(findAssetInfoOrThrow).toHaveBeenCalledWith(
      'Ethereum',
      { symbol: 'WETH', amount: '1' },
      'AssetHubPolkadot'
    )
    expect(abstractDecimals).toHaveBeenCalledWith('1', ethAsset.decimals, expect.any(Object))
    expect(SnowbridgeApi).toHaveBeenCalledTimes(1)
    expect(ViemEthereumProvider).toHaveBeenCalledTimes(1)
    expect(setEthProvider).toHaveBeenCalledWith(1, publicClient)
    expect(senderFactory).toHaveBeenCalledWith(
      { kind: 'ethereum', id: 1 },
      { kind: 'polkadot', id: 1000 }
    )
    expect(assertHasId).toHaveBeenCalledWith(ethAsset)
    expect(senderMethods.fee).toHaveBeenCalledWith(ASSET_ID)
    expect(senderMethods.tx).toHaveBeenCalledWith(SOURCE, RECIPIENT, ASSET_ID, 1_000n, {
      fee: 10n
    })
    expect(senderMethods.validate).toHaveBeenCalled()

    expect(result.tx).toEqual({
      type: 'eip1559',
      to: '0xabc',
      data: '0x',
      value: 5n,
      chainId: 1
    })
    expect(result.sender).toBe(senderMethods)
  })

  it('defaults value to 0n when sender.tx omits it', async () => {
    senderMethods.tx.mockResolvedValue({ tx: { to: '0xabc', data: '0x' } })
    const result = await buildSnowbridgeTransfer(baseOptions(), publicClient)
    expect(result.tx.value).toBe(0n)
  })

  it('throws RoutingResolutionError listing all error logs from validate', async () => {
    senderMethods.validate.mockResolvedValue({
      logs: [
        { kind: toPolkadotV2.ValidationKind.Warning, message: 'ignored warning' },
        { kind: toPolkadotV2.ValidationKind.Error, message: 'error1' },
        { kind: toPolkadotV2.ValidationKind.Error, message: 'error2' }
      ]
    })

    await expect(buildSnowbridgeTransfer(baseOptions(), publicClient)).rejects.toThrow(
      /error1[\s\S]*error2/
    )
    await expect(buildSnowbridgeTransfer(baseOptions(), publicClient)).rejects.toThrow(
      RoutingResolutionError
    )
  })

  it('uses the cached WS public client when caller does not supply one', async () => {
    const cachedClient = { id: 'cached' } as unknown as PublicClient
    vi.mocked(leaseClient).mockResolvedValue(cachedClient)

    const result = await buildSnowbridgeTransfer(baseOptions())

    expect(leaseClient).toHaveBeenCalledTimes(1)
    expect(leaseClient).toHaveBeenCalledWith(ETHEREUM_WS_URLS, DEFAULT_TTL_MS)
    expect(setEthProvider).toHaveBeenCalledWith(1, cachedClient)
    expect(releaseClient).toHaveBeenCalledWith(ETHEREUM_WS_URLS)
    expect(result.tx.chainId).toBe(1)
  })

  it('does not release the lease when validation fails (TTL handles cleanup)', async () => {
    senderMethods.validate.mockResolvedValue({
      logs: [{ kind: toPolkadotV2.ValidationKind.Error, message: 'nope' }]
    })

    await expect(buildSnowbridgeTransfer(baseOptions())).rejects.toThrow(RoutingResolutionError)
    expect(leaseClient).toHaveBeenCalledTimes(1)
    expect(releaseClient).not.toHaveBeenCalled()
  })

  it('does not lease the cache when caller supplies a public client', async () => {
    await buildSnowbridgeTransfer(baseOptions(), publicClient)
    expect(leaseClient).not.toHaveBeenCalled()
    expect(releaseClient).not.toHaveBeenCalled()
    expect(setEthProvider).toHaveBeenCalledWith(1, publicClient)
  })

  it.each(['AssetHubWestend', 'AssetHubPaseo', 'AssetHubKusama'] as const)(
    'rejects Ethereum to %s before selecting a Snowbridge environment',
    async destination => {
      await expect(
        buildSnowbridgeTransfer(baseOptions({ to: destination }), publicClient)
      ).rejects.toThrow(ScenarioNotSupportedError)
      await expect(
        buildSnowbridgeTransfer(baseOptions({ to: destination }), publicClient)
      ).rejects.toThrow(new RegExp(`Transfers from Ethereum to ${destination} are not supported`))
      expect(bridgeInfoFor).not.toHaveBeenCalled()
      expect(findAssetInfoOrThrow).not.toHaveBeenCalled()
      expect(SnowbridgeApi).not.toHaveBeenCalled()
    }
  )

  it('rejects mismatched EthereumTestnet pairs', async () => {
    await expect(
      buildSnowbridgeTransfer(
        baseOptions({ from: 'EthereumTestnet', to: 'AssetHubPolkadot' }),
        publicClient
      )
    ).rejects.toThrow(/Transfers from EthereumTestnet to AssetHubPolkadot are not supported/)
    await expect(
      buildSnowbridgeTransfer(
        baseOptions({ from: 'EthereumTestnet', to: 'AssetHubKusama' }),
        publicClient
      )
    ).rejects.toThrow(ScenarioNotSupportedError)
    expect(bridgeInfoFor).not.toHaveBeenCalled()
  })

  it('builds EthereumTestnet to AssetHubWestend against westend_sepolia', async () => {
    const result = await buildSnowbridgeTransfer(
      baseOptions({ from: 'EthereumTestnet', to: 'AssetHubWestend' }),
      publicClient
    )

    expect(bridgeInfoFor).toHaveBeenCalledWith('westend_sepolia')
    expect(findAssetInfoOrThrow).toHaveBeenCalledWith(
      'EthereumTestnet',
      { symbol: 'WETH', amount: '1' },
      'AssetHubWestend'
    )
    expect(getParaId).toHaveBeenCalledWith('AssetHubWestend')
    expect(senderFactory).toHaveBeenCalledWith(
      { kind: 'ethereum', id: 11155111 },
      { kind: 'polkadot', id: 1000 }
    )
    expect(setEthProvider).toHaveBeenCalledWith(11155111, publicClient)
    expect(result.tx.chainId).toBe(11155111)
  })

  it('builds EthereumTestnet to AssetHubPaseo against paseo_sepolia', async () => {
    const result = await buildSnowbridgeTransfer(
      baseOptions({ from: 'EthereumTestnet', to: 'AssetHubPaseo' }),
      publicClient
    )

    expect(bridgeInfoFor).toHaveBeenCalledWith('paseo_sepolia')
    expect(senderFactory).toHaveBeenCalledWith(
      { kind: 'ethereum', id: 11155112 },
      { kind: 'polkadot', id: 1000 }
    )
    expect(result.tx.chainId).toBe(11155112)
  })

  it('leases the Sepolia client pool when an EthereumTestnet transfer has no caller client', async () => {
    await buildSnowbridgeTransfer(baseOptions({ from: 'EthereumTestnet', to: 'AssetHubPaseo' }))

    expect(leaseClient).toHaveBeenCalledWith(ETHEREUM_TESTNET_WS_URLS, DEFAULT_TTL_MS)
    expect(releaseClient).toHaveBeenCalledWith(ETHEREUM_TESTNET_WS_URLS)
  })

  it('defaults a missing origin to Ethereum', async () => {
    const options = baseOptions()
    delete (options as { from?: string }).from

    await buildSnowbridgeTransfer(options, publicClient)

    expect(bridgeInfoFor).toHaveBeenCalledWith('polkadot_mainnet')
    expect(findAssetInfoOrThrow).toHaveBeenCalledWith(
      'Ethereum',
      { symbol: 'WETH', amount: '1' },
      'AssetHubPolkadot'
    )
  })
})

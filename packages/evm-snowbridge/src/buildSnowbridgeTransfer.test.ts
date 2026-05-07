import type { TAssetInfo, TBuildEvmTransferOptions } from '@paraspell/sdk-core'
import {
  abstractDecimals,
  assertHasId,
  DEFAULT_TTL_MS,
  findAssetInfoOrThrow,
  getParaId,
  isOverrideLocationSpecifier,
  RoutingResolutionError,
  UnsupportedOperationError
} from '@paraspell/sdk-core'
import { SnowbridgeApi, toPolkadotV2 } from '@snowbridge/api'
import type { BridgeInfo, Environment } from '@snowbridge/base-types'
import { ViemEthereumProvider } from '@snowbridge/provider-viem'
import { bridgeInfoFor } from '@snowbridge/registry'
import type { PublicClient } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { buildSnowbridgeTransfer } from './buildSnowbridgeTransfer'
import { createEnvironment } from './createEnvironment'
import { ETHEREUM_WS_URLS, leaseClient, releaseClient } from './viemClientCache'

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
  getParaId: vi.fn(),
  isOverrideLocationSpecifier: vi.fn()
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
  leaseClient: vi.fn(),
  releaseClient: vi.fn()
}))

const ASSET_ID = '0x2222222222222222222222222222222222222222'
const SOURCE = '0x3333333333333333333333333333333333333333'
const RECIPIENT = '0x4444444444444444444444444444444444444444'

const ethAsset: TAssetInfo = {
  symbol: 'WETH',
  decimals: 18,
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
    vi.mocked(isOverrideLocationSpecifier).mockReturnValue(false)

    vi.mocked(bridgeInfoFor).mockReturnValue({
      environment: { ethChainId: 1 }
    } as unknown as BridgeInfo)
    vi.mocked(createEnvironment).mockReturnValue({ ethChainId: 1 } as Environment)

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

  it('throws UnsupportedOperationError when currency uses an override location', async () => {
    vi.mocked(isOverrideLocationSpecifier).mockReturnValue(true)

    await expect(
      buildSnowbridgeTransfer(
        baseOptions({
          currency: {
            location: { type: 'Override', value: { parents: 0, interior: 'Here' } },
            amount: '1'
          }
        }),
        publicClient
      )
    ).rejects.toThrow(UnsupportedOperationError)
  })

  it('returns prepared tx and Snowbridge sender on success', async () => {
    const result = await buildSnowbridgeTransfer(baseOptions(), publicClient)

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
    expect(setEthProvider).toHaveBeenCalledWith(1, publicClient)
  })
})

import { DEFAULT_TTL_MS, EXTENSION_MS } from '@paraspell/sdk-core'
import type { PublicClient } from 'viem'
import { createPublicClient, fallback, webSocket } from 'viem'
import { mainnet } from 'viem/chains'
import { getWebSocketRpcClient, socketClientCache } from 'viem/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ETHEREUM_WS_URLS, leaseClient, releaseClient } from './viemClientCache'

vi.mock('viem', async importOriginal => ({
  ...(await importOriginal<typeof import('viem')>()),
  createPublicClient: vi.fn(),
  fallback: vi.fn((arr: unknown[]) => ({ kind: 'fallback', inner: arr })),
  webSocket: vi.fn((url: string) => ({ kind: 'webSocket', url }))
}))

let urlSeq = 0
const uniqueUrls = (n = 1) => Array.from({ length: n }, () => `wss://test-${++urlSeq}.example`)

class FakeWebSocket {
  readyState = 1
  onMessage?: (event: { data: string }) => void

  addEventListener(type: string, listener: (event: { data: string }) => void) {
    if (type === 'message') this.onMessage = listener
  }

  removeEventListener() {}

  send(data: string) {
    const { id }: { id: number | null } = JSON.parse(data)
    this.onMessage?.({ data: JSON.stringify({ id, result: '0x1' }) })
  }

  close() {}
}

describe('publicClientCache', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    let counter = 0
    vi.mocked(createPublicClient).mockImplementation(
      () =>
        ({
          id: ++counter,
          getBlockNumber: vi.fn().mockResolvedValue(1n)
        }) as unknown as PublicClient
    )
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('exposes a non-empty list of fallback WSS endpoints', () => {
    expect(ETHEREUM_WS_URLS.length).toBeGreaterThan(1)
    for (const url of ETHEREUM_WS_URLS) {
      expect(url.startsWith('wss://')).toBe(true)
    }
  })

  it('builds a public client with viem fallback over each URL on first lease', async () => {
    const urls = uniqueUrls(2)

    await leaseClient(urls, DEFAULT_TTL_MS)

    expect(webSocket).toHaveBeenCalledTimes(2)
    const keepAlive = { owner: expect.stringMatching(/^paraspell-/) }
    expect(webSocket).toHaveBeenNthCalledWith(1, urls[0], { keepAlive })
    expect(webSocket).toHaveBeenNthCalledWith(2, urls[1], { keepAlive })
    expect(fallback).toHaveBeenCalledWith([
      { kind: 'webSocket', url: urls[0] },
      { kind: 'webSocket', url: urls[1] }
    ])
    expect(createPublicClient).toHaveBeenCalledWith({
      chain: mainnet,
      transport: { kind: 'fallback', inner: expect.any(Array) }
    })

    releaseClient(urls)
  })

  it('reuses the same client across calls with identical URL list', async () => {
    const urls = uniqueUrls(2)

    const first = await leaseClient(urls, DEFAULT_TTL_MS)
    const second = await leaseClient(urls, DEFAULT_TTL_MS)

    expect(createPublicClient).toHaveBeenCalledTimes(1)
    expect(first).toBe(second)

    releaseClient(urls)
    releaseClient(urls)
  })

  it('builds a separate client for a different URL list', async () => {
    const a = uniqueUrls(1)
    const b = uniqueUrls(1)

    const first = await leaseClient(a, DEFAULT_TTL_MS)
    const second = await leaseClient(b, DEFAULT_TTL_MS)

    expect(createPublicClient).toHaveBeenCalledTimes(2)
    expect(first).not.toBe(second)

    releaseClient(a)
    releaseClient(b)
  })

  it('rebuilds the client after the cache evicts it once all refs are released', async () => {
    const urls = uniqueUrls(1)

    await leaseClient(urls, DEFAULT_TTL_MS)
    expect(createPublicClient).toHaveBeenCalledTimes(1)

    releaseClient(urls)

    // First TTL fires while refs > 0 → grace period; second fires after EXTENSION_MS → real eviction.
    await vi.advanceTimersByTimeAsync(DEFAULT_TTL_MS + EXTENSION_MS + 1)

    await leaseClient(urls, DEFAULT_TTL_MS)
    expect(createPublicClient).toHaveBeenCalledTimes(2)

    releaseClient(urls)
  })

  it('closes only its own sockets when the cache evicts the client', async () => {
    const actual = await vi.importActual<typeof import('viem')>('viem')
    vi.mocked(createPublicClient).mockImplementation(actual.createPublicClient)
    vi.mocked(fallback).mockImplementation(actual.fallback)
    vi.mocked(webSocket).mockImplementation(actual.webSocket)
    vi.stubGlobal('WebSocket', FakeWebSocket)
    vi.useFakeTimers({ shouldAdvanceTime: true })

    const urls = uniqueUrls()
    const consumerSocket = await getWebSocketRpcClient(urls[0])

    const client = await leaseClient(urls, DEFAULT_TTL_MS)
    await client.getBlockNumber()
    releaseClient(urls)

    expect(socketClientCache.size).toBe(2)

    await vi.advanceTimersByTimeAsync(DEFAULT_TTL_MS + EXTENSION_MS + 1)

    expect([...socketClientCache.values()]).toEqual([consumerSocket])
  })
})

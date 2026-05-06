import { DEFAULT_TTL_MS, EXTENSION_MS } from '@paraspell/sdk-core'
import type { PublicClient } from 'viem'
import { createPublicClient, fallback, webSocket } from 'viem'
import { mainnet } from 'viem/chains'
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
    vi.clearAllMocks()
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
    expect(webSocket).toHaveBeenNthCalledWith(1, urls[0])
    expect(webSocket).toHaveBeenNthCalledWith(2, urls[1])
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
})

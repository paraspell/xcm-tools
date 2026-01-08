import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createClientPoolHelpers, keyFromWs } from './clientPool'
import { createClientCache } from './TimedCache'

type TFakeClient = {
  id: number
}

describe('clientPool', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('keyFromWs returns a stable key', () => {
    expect(keyFromWs('wss://node')).toBe('wss://node')
    expect(keyFromWs(['wss://a', 'wss://b'])).toBe('["wss://a","wss://b"]')
  })

  it('leaseClient creates once, reuses, and revives TTL', async () => {
    const pingClient = vi.fn().mockResolvedValue(undefined)
    const cache = createClientCache<TFakeClient>(10, pingClient)
    const reviveSpy = vi.spyOn(cache, 'revive')

    let created = 0
    const createClient = vi.fn(() => {
      created += 1
      return { id: created }
    })

    const { leaseClient } = createClientPoolHelpers(cache, createClient)

    const ws = 'wss://node'

    const c1 = await leaseClient(ws, 1_000, false)
    const c2 = await leaseClient(ws, 1_000, true)

    expect(c2).toBe(c1)
    expect(createClient).toHaveBeenCalledTimes(1)
    expect(createClient).toHaveBeenCalledWith(ws, false)

    const entry = cache.peek(keyFromWs(ws))
    expect(entry?.refs).toBe(2)

    expect(reviveSpy).toHaveBeenCalledTimes(2)
    expect(reviveSpy).toHaveBeenNthCalledWith(1, keyFromWs(ws), 1_000)
    expect(reviveSpy).toHaveBeenNthCalledWith(2, keyFromWs(ws), 1_000)
  })

  it('leaseClient resets destroyWanted to false', async () => {
    const pingClient = vi.fn().mockResolvedValue(undefined)
    const cache = createClientCache<TFakeClient>(10, pingClient)

    const createClient = vi.fn(() => ({ id: 1 }))
    const { leaseClient } = createClientPoolHelpers(cache, createClient)

    const ws = ['wss://a', 'wss://b']
    await leaseClient(ws, 1_000, false)

    const key = keyFromWs(ws)
    const entry = cache.peek(key)
    expect(entry).toBeDefined()

    entry!.destroyWanted = true

    await leaseClient(ws, 1_000, false)
    expect(cache.peek(key)?.destroyWanted).toBe(false)
  })

  it('releaseClient is a no-op when missing and evicts when destroyWanted && refs hits 0', async () => {
    const pingClient = vi.fn().mockResolvedValue(undefined)
    const cache = createClientCache<TFakeClient>(10, pingClient)
    const deleteSpy = vi.spyOn(cache, 'delete')

    const createClient = vi.fn(() => ({ id: 1 }))
    const { leaseClient, releaseClient } = createClientPoolHelpers(cache, createClient)

    releaseClient('wss://missing')
    expect(deleteSpy).not.toHaveBeenCalled()

    const ws = 'wss://node'
    await leaseClient(ws, 1_000, false)

    const key = keyFromWs(ws)
    const entry = cache.peek(key)
    entry!.destroyWanted = true

    releaseClient(ws)

    expect(deleteSpy).toHaveBeenCalledWith(key)
    expect(cache.has(key)).toBe(false)
  })
})

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { TClientEntry } from '../types'
import { createClientCache } from './TimedCache'

type TFakeClient = {
  getChainSpecData: () => Promise<void>
}

const fakeApi = () =>
  ({
    getChainSpecData: vi.fn().mockResolvedValue(undefined)
  }) as TFakeClient

const entry = (refs = 0): TClientEntry<TFakeClient> => ({
  client: fakeApi(),
  refs,
  destroyWanted: false
})

describe('createClientCache', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('set / get / has / peek refresh a normal TTL', () => {
    const pingClient = vi.fn().mockResolvedValue(undefined)
    const cache = createClientCache<TFakeClient>(10, pingClient)
    cache.set('a', entry(), 1_000)

    expect(cache.has('a')).toBe(true)
    expect(cache.peek('a')?.refs).toBe(0)

    vi.advanceTimersByTime(500)
    const beforeRefresh = cache.remainingTtl('a')!
    expect(beforeRefresh).toBeLessThanOrEqual(500)

    const got = cache.get('a')
    expect(got).toBeDefined()

    const afterRefresh = cache.remainingTtl('a')!
    expect(afterRefresh).toBeGreaterThan(beforeRefresh)
  })

  it('evicts when the simple TTL elapses (refs = 0)', () => {
    const pingClient = vi.fn().mockResolvedValue(undefined)
    const onEviction = vi.fn()
    const cache = createClientCache<TFakeClient>(10, pingClient, onEviction)
    cache.set('victim', entry(0), 1_000)

    vi.advanceTimersByTime(1_001)
    expect(cache.has('victim')).toBe(false)
    expect(onEviction).toHaveBeenCalledWith('victim', expect.any(Object))
  })

  it('extends once when refs > 0, then evicts after extensionMs', () => {
    const EXT_MS = 3_000
    const pingClient = vi.fn().mockResolvedValue(undefined)
    const onEviction = vi.fn()
    const cache = createClientCache<TFakeClient>(10, pingClient, onEviction, EXT_MS)

    const e = entry(2)
    cache.set('live', e, 1_000)

    vi.advanceTimersByTime(1_000)
    expect(e.destroyWanted).toBe(true)
    expect(cache.has('live')).toBe(true)

    vi.advanceTimersByTime(EXT_MS + 1)
    expect(cache.has('live')).toBe(false)
    expect(onEviction).toHaveBeenCalledWith('live', e)
  })

  it('delete() removes immediately and clear() wipes all', () => {
    const pingClient = vi.fn().mockResolvedValue(undefined)
    const cache = createClientCache<TFakeClient>(10, pingClient)
    cache.set('x', entry(), 1_000)
    cache.set('y', entry(), 1_000)

    expect(cache.delete('x')).toBe(true)
    expect(cache.has('x')).toBe(false)

    cache.clear()
    expect(cache.has('y')).toBe(false)
  })

  it('revive() shortens the timer only when ttl < remaining', () => {
    const pingClient = vi.fn().mockResolvedValue(undefined)
    const cache = createClientCache<TFakeClient>(10, pingClient)
    cache.set('r', entry(), 1_000)

    vi.advanceTimersByTime(200)
    cache.revive('r', 300)

    vi.advanceTimersByTime(299)
    expect(cache.has('r')).toBe(true)

    vi.advanceTimersByTime(2)
    expect(cache.has('r')).toBe(false)
  })

  it('evictIfNeeded respects maxSize and calls onEviction', () => {
    const pingClient = vi.fn().mockResolvedValue(undefined)
    const onEviction = vi.fn()
    const cache = createClientCache<TFakeClient>(2, pingClient, onEviction)

    cache.set('a', entry(), 10_000)
    cache.set('b', entry(), 10_000)
    cache.set('c', entry(), 10_000)

    expect(cache.has('a') || cache.has('b')).toBeTruthy()
    expect(cache.has('c')).toBe(true)
    expect(onEviction).toHaveBeenCalledTimes(1)
  })
})

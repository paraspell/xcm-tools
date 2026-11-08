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

  it('swallows a throwing onEviction and still removes the entry', () => {
    const pingClient = vi.fn().mockResolvedValue(undefined)
    const onEviction = vi.fn(() => {
      throw new Error('teardown failed')
    })
    const cache = createClientCache<TFakeClient>(10, pingClient, onEviction)
    cache.set('victim', entry(0), 1_000)

    expect(() => vi.advanceTimersByTime(1_001)).not.toThrow()
    expect(onEviction).toHaveBeenCalledTimes(1)
    expect(cache.has('victim')).toBe(false)
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

  it('revive() extends a live lease instead of truncating it', () => {
    const pingClient = vi.fn().mockResolvedValue(undefined)
    const cache = createClientCache<TFakeClient>(10, pingClient)
    cache.set('r', entry(), 1_000)

    vi.advanceTimersByTime(800)
    cache.revive('r', 5_000)

    expect(cache.remainingTtl('r')).toBeGreaterThan(4_000)

    vi.advanceTimersByTime(4_000)
    expect(cache.has('r')).toBe(true)
  })

  it('revive() never shortens an entry that still has more life than the new lease', () => {
    const pingClient = vi.fn().mockResolvedValue(undefined)
    const cache = createClientCache<TFakeClient>(10, pingClient)
    cache.set('r', entry(), 1_000)

    vi.advanceTimersByTime(200)
    cache.revive('r', 300)

    expect(cache.remainingTtl('r')).toBeGreaterThan(700)

    vi.advanceTimersByTime(599)
    expect(cache.has('r')).toBe(true)
  })

  it('evictIfNeeded never evicts a leased entry while an idle one exists', () => {
    const pingClient = vi.fn().mockResolvedValue(undefined)
    const onEviction = vi.fn()
    const cache = createClientCache<TFakeClient>(2, pingClient, onEviction)

    const live = entry(1)
    live.destroyWanted = true
    cache.set('live', live, 1_000) // shortest time left and already marked for destroy
    cache.set('idle', entry(0), 10_000)

    cache.set('new', entry(0), 10_000)

    expect(cache.has('live')).toBe(true)
    expect(cache.has('idle')).toBe(false)
    expect(onEviction).toHaveBeenCalledExactlyOnceWith('idle', expect.any(Object))
  })

  it('evictIfNeeded still evicts when every entry is leased', () => {
    const pingClient = vi.fn().mockResolvedValue(undefined)
    const onEviction = vi.fn()
    const cache = createClientCache<TFakeClient>(2, pingClient, onEviction)

    cache.set('a', entry(2), 10_000)
    cache.set('b', entry(1), 5_000) // least bad leased victim: smallest time left
    cache.set('c', entry(3), 10_000)

    expect(onEviction).toHaveBeenCalledTimes(1)
    expect(cache.has('b')).toBe(false)
    expect(cache.has('a')).toBe(true)
    expect(cache.has('c')).toBe(true)
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

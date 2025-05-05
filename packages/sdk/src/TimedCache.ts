import type { TPapiApi } from './types'

export type TClientKey = string

export interface TClientEntry {
  client: TPapiApi
  refs: number
  destroyWanted: boolean
}

export interface ClientCache {
  set: (k: TClientKey, v: TClientEntry, ttl: number) => void
  get: (k: TClientKey) => TClientEntry | undefined
  delete: (k: TClientKey) => boolean
  has: (k: TClientKey) => boolean
  clear: () => void
  peek: (k: TClientKey) => TClientEntry | undefined
  remainingTtl: (k: TClientKey) => number | undefined
  revive: (k: TClientKey, ttl: number) => void
}

export function createClientCache(
  maxSize: number,
  onEviction?: (key: TClientKey, value: TClientEntry) => void,
  extensionMs = 5 * 60_000
): ClientCache {
  type Wrapped = {
    value: TClientEntry
    ttl: number
    expireAt: number
    extended: boolean // Flag to indicate if the entry has been extended
  }

  const data = new Map<TClientKey, Wrapped>()
  const timers = new Map<TClientKey, NodeJS.Timeout>()

  const now = () => Date.now()
  const timeLeft = (w: Wrapped) => Math.max(w.expireAt - now(), 0)

  const schedule = (k: TClientKey, delay: number) => {
    if (timers.has(k)) clearTimeout(timers.get(k))
    timers.set(
      k,
      setTimeout(() => handleTimeout(k), delay)
    )
  }

  const handleTimeout = (k: TClientKey) => {
    const w = data.get(k)
    if (!w) return

    if (!w.extended && w.value.refs > 0) {
      // first expiry while still in use - Extend grace period
      // Call rpc.properties to keep the connection alive
      void (async () => {
        try {
          await w.value.client.getChainSpecData()
        } catch {
          /* ignore */
        }
      })()
      w.value.destroyWanted = true
      w.extended = true
      w.expireAt = now() + extensionMs
      schedule(k, extensionMs)
      return
    }
    evict(k) // second expiry or unused - real eviction
  }

  const evict = (k: TClientKey) => {
    const w = data.get(k)
    if (!w) return
    clearTimeout(timers.get(k))
    timers.delete(k)
    data.delete(k)
    onEviction?.(k, w.value)
  }

  const evictIfNeeded = () => {
    if (data.size <= maxSize) return

    let victimKey: TClientKey | undefined
    let victim: Wrapped | undefined

    for (const [k, w] of data) {
      if (!victim) {
        victimKey = k
        victim = w
        continue
      }

      const better =
        (w.extended && !victim.extended) || // Prefer extended over normal
        (w.extended === victim.extended && w.value.destroyWanted && !victim.value.destroyWanted) ||
        (w.extended === victim.extended &&
          w.value.destroyWanted === victim.value.destroyWanted &&
          timeLeft(w) < timeLeft(victim)) ||
        (w.extended === victim.extended &&
          w.value.destroyWanted === victim.value.destroyWanted &&
          timeLeft(w) === timeLeft(victim) &&
          w.value.refs < victim.value.refs) // Prefer with less refs
      if (better) {
        victimKey = k
        victim = w
      }
    }

    if (victimKey !== undefined) evict(victimKey)
  }

  const set = (k: TClientKey, v: TClientEntry, ttl: number) => {
    const existing = data.get(k)

    if (existing) {
      existing.value = v
      existing.ttl = ttl
      existing.extended = false
      existing.expireAt = now() + ttl
      schedule(k, ttl)
    } else {
      data.set(k, {
        value: v,
        ttl,
        extended: false,
        expireAt: now() + ttl
      })
      schedule(k, ttl)
    }
    evictIfNeeded()
  }

  const get = (k: TClientKey) => {
    const w = data.get(k)
    if (!w) return undefined

    if (!w.extended && timeLeft(w) < w.ttl) {
      w.expireAt = now() + w.ttl // refresh normal life
      schedule(k, w.ttl)
    }
    return w.value
  }

  const revive = (k: TClientKey, ttl: number) => {
    const w = data.get(k)
    if (!w) return

    const remaining = timeLeft(w)
    w.extended = false

    if (ttl < remaining) {
      w.ttl = ttl
      w.expireAt = now() + ttl
      schedule(k, ttl)
    }
    // if ttl ≥ remaining - keep current timer
  }

  const del = (k: TClientKey) => {
    if (!data.has(k)) return false
    evict(k)
    return true
  }

  const clear = () => {
    for (const t of timers.values()) clearTimeout(t)
    timers.clear()
    data.clear()
  }

  return {
    set,
    get,
    delete: del,
    has: k => data.has(k),
    clear,
    peek: k => data.get(k)?.value,
    remainingTtl: k => {
      const w = data.get(k)
      return w ? timeLeft(w) : undefined
    },
    revive
  }
}

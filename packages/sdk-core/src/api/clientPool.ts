import type { ClientCache, TClientEntry, TClientKey, TUrl } from '../types'

export const keyFromWs = (ws: TUrl): TClientKey => {
  return Array.isArray(ws) ? JSON.stringify(ws) : ws
}

export const createClientPoolHelpers = <TClient extends object>(
  clientPool: ClientCache<TClient>,
  createClient: (ws: TUrl) => TClient | Promise<TClient>
) => {
  const pendingClients = new Map<TClientKey, Promise<TClientEntry<TClient>>>()
  // Which entry each leased client belongs to. Release must not trust the key alone:
  // an entry can be evicted and re-leased under the same key while a caller still
  // holds the old client, and a key-based release would then decrement the new entry.
  const leasedEntry = new WeakMap<TClient, TClientEntry<TClient>>()

  const createEntry = async (
    key: TClientKey,
    ws: TUrl,
    ttlMs: number
  ): Promise<TClientEntry<TClient>> => {
    const client = await createClient(ws)
    const entry = { client, refs: 0, destroyWanted: false }

    clientPool.set(key, entry, ttlMs)
    return entry
  }

  const getOrCreateEntry = (
    key: TClientKey,
    ws: TUrl,
    ttlMs: number
  ): Promise<TClientEntry<TClient>> => {
    const pending = pendingClients.get(key)
    if (pending) return pending

    const creation = Promise.resolve()
      .then(() => createEntry(key, ws, ttlMs))
      .finally(() => {
        pendingClients.delete(key)
      })

    pendingClients.set(key, creation)
    return creation
  }

  const leaseClient = async (ws: TUrl, ttlMs: number): Promise<TClient> => {
    const key = keyFromWs(ws)
    let entry = clientPool.peek(key)

    if (!entry) {
      entry = await getOrCreateEntry(key, ws, ttlMs)
    }

    entry.refs += 1
    entry.destroyWanted = false
    clientPool.revive(key, ttlMs)
    leasedEntry.set(entry.client, entry)

    return entry.client
  }

  const releaseClient = (ws: TUrl, client?: TClient) => {
    const key = keyFromWs(ws)
    const current = clientPool.peek(key)

    const entry = (client !== undefined ? leasedEntry.get(client) : undefined) ?? current

    if (!entry || entry.refs === 0) {
      return
    }

    entry.refs -= 1

    // Only the entry that still owns the key can be destroyed on the way out
    if (entry.refs === 0 && entry.destroyWanted && entry === current) {
      clientPool.delete(key)
    }

    if (client !== undefined && entry.refs === 0) {
      leasedEntry.delete(client)
    }
  }

  return { leaseClient, releaseClient }
}

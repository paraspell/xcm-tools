import type { ClientCache, TClientEntry, TClientKey, TUrl } from '../types'

export const keyFromWs = (ws: TUrl): TClientKey => {
  return Array.isArray(ws) ? JSON.stringify(ws) : ws
}

export const createClientPoolHelpers = <TClient>(
  clientPool: ClientCache<TClient>,
  createClient: (ws: TUrl) => TClient | Promise<TClient>
) => {
  const pendingClients = new Map<TClientKey, Promise<TClientEntry<TClient>>>()

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

    return entry.client
  }

  const releaseClient = (ws: TUrl) => {
    const key = keyFromWs(ws)
    const entry = clientPool.peek(key)

    if (!entry) {
      return
    }

    entry.refs -= 1

    if (entry.refs === 0 && entry.destroyWanted) {
      clientPool.delete(key)
    }
  }

  return { leaseClient, releaseClient }
}

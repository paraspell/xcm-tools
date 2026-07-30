import type { ClientCache, TClientEntry, TClientKey, TUrl } from '../types'

export const keyFromWs = (ws: TUrl): TClientKey => {
  return Array.isArray(ws) ? JSON.stringify(ws) : ws
}

export const createClientPoolHelpers = <TClient>(
  clientPool: ClientCache<TClient>,
  createClient: (ws: TUrl) => TClient | Promise<TClient>
) => {
  const pendingClients = new Map<TClientKey, Promise<TClientEntry<TClient>>>()

  const leaseClient = async (ws: TUrl, ttlMs: number): Promise<TClient> => {
    const key = keyFromWs(ws)
    let entry = clientPool.peek(key)

    if (!entry) {
      let pending = pendingClients.get(key)
      if (!pending) {
        pending = Promise.resolve()
          .then(() => createClient(ws))
          .then(client => {
            const created = { client, refs: 0, destroyWanted: false }
            clientPool.set(key, created, ttlMs)
            return created
          })
        pendingClients.set(key, pending)
      }

      try {
        entry = await pending
      } finally {
        if (pendingClients.get(key) === pending) {
          pendingClients.delete(key)
        }
      }
    }

    entry.refs += 1

    clientPool.revive(key, ttlMs)
    entry.destroyWanted = false

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

import type { ClientCache, TClientKey, TUrl } from '../types'

export const keyFromWs = (ws: TUrl): TClientKey => {
  return Array.isArray(ws) ? JSON.stringify(ws) : ws
}

export const createClientPoolHelpers = <TClient>(
  clientPool: ClientCache<TClient>,
  createClient: (ws: TUrl, useLegacy: boolean) => TClient | Promise<TClient>
) => {
  const leaseClient = async (ws: TUrl, ttlMs: number, useLegacy: boolean): Promise<TClient> => {
    const key = keyFromWs(ws)
    let entry = clientPool.peek(key)

    if (!entry) {
      const client = await createClient(ws, useLegacy)
      entry = { client, refs: 0, destroyWanted: false }
      clientPool.set(key, entry, ttlMs)
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

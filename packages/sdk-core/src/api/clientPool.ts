import type { ClientCache, TClientKey, TUrl } from '../types'

export const keyFromWs = (ws: TUrl): TClientKey => {
  return Array.isArray(ws) ? JSON.stringify(ws) : ws
}

export const createClientPoolHelpers = <TClient>(
  clientPool: ClientCache<TClient>,
  createClient: (ws: TUrl) => TClient | Promise<TClient>
) => {
  // Track in-flight client creations to prevent duplicate work on concurrent leases.
  const inflight = new Map<TClientKey, Promise<TClient>>()

  const leaseClient = async (ws: TUrl, ttlMs: number): Promise<TClient> => {
    const key = keyFromWs(ws)
    let entry = clientPool.peek(key)

    if (!entry) {
      // If a creation is already in-flight for this key, await it instead of
      // starting a second createClient call. This ensures both concurrent
      // lessees receive the same client instance and refs is incremented to 2.
      let inflightPromise = inflight.get(key)
      if (!inflightPromise) {
        inflightPromise = Promise.resolve(createClient(ws)).finally(() => {
          inflight.delete(key)
        })
        inflight.set(key, inflightPromise)
      }

      const client = await inflightPromise
      entry = clientPool.peek(key)
      if (!entry) {
        entry = { client, refs: 0, destroyWanted: false }
        clientPool.set(key, entry, ttlMs)
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

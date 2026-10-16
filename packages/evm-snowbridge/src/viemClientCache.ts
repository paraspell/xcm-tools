import {
  createClientCache,
  createClientPoolHelpers,
  EXTENSION_MS,
  MAX_CLIENTS
} from '@paraspell/sdk-core'
import type { PublicClient } from 'viem'
import { createPublicClient, fallback, webSocket } from 'viem'
import { mainnet } from 'viem/chains'

export const ETHEREUM_WS_URLS: string[] = [
  'wss://ethereum-rpc.publicnode.com',
  'wss://eth.drpc.org',
  'wss://eth.llamarpc.com',
  'wss://ethereum.public.blockpi.network/v1/ws/public',
  'wss://eth-mainnet.public.blastapi.io'
]

const closeViemTransport = (transport: unknown): void => {
  if (!transport || typeof transport !== 'object') return

  const value = (
    transport as {
      value?: { getRpcClient?: unknown; transports?: unknown }
    }
  ).value

  // webSocket transport: close its (cached) RPC socket client.
  if (typeof value?.getRpcClient === 'function') {
    void Promise.resolve()
      .then(() => (value.getRpcClient as () => Promise<unknown>)())
      .then(client => (client as { close?: () => void }).close?.())
      .catch(() => {})
    return
  }

  // fallback transport: recurse into every underlying transport.
  if (Array.isArray(value?.transports)) {
    value.transports.forEach(closeViemTransport)
    return
  }
}

const cache = createClientCache<PublicClient>(
  MAX_CLIENTS,
  async client => {
    await client.getBlockNumber()
  },
  (_key, entry) => {
    // Evicted clients must stop their auto-reconnecting WebSocket transports,
    // otherwise those sockets stay open for the rest of the process lifetime.
    if (entry.client.transport) closeViemTransport(entry.client.transport)
  },
  EXTENSION_MS
)

export const { leaseClient, releaseClient } = createClientPoolHelpers<PublicClient>(cache, urls => {
  const list = Array.isArray(urls) ? urls : [urls]
  return createPublicClient({
    chain: mainnet,
    transport: fallback(list.map(url => webSocket(url)))
  })
})

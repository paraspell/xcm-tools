import {
  createClientCache,
  createClientPoolHelpers,
  EXTENSION_MS,
  MAX_CLIENTS
} from '@paraspell/sdk-core'
import type { PublicClient } from 'viem'
import { createPublicClient, fallback, webSocket } from 'viem'
import { mainnet, sepolia } from 'viem/chains'

export const ETHEREUM_WS_URLS: string[] = [
  'wss://ethereum-rpc.publicnode.com',
  'wss://eth.drpc.org',
  'wss://eth.llamarpc.com',
  'wss://ethereum.public.blockpi.network/v1/ws/public',
  'wss://eth-mainnet.public.blastapi.io'
]

export const ETHEREUM_TESTNET_WS_URLS: string[] = [
  'wss://ethereum-sepolia-rpc.publicnode.com',
  'wss://sepolia.drpc.org',
  'wss://eth-sepolia.public.blastapi.io'
]

const cache = createClientCache<PublicClient>(
  MAX_CLIENTS,
  async client => {
    await client.getBlockNumber()
  },
  undefined,
  EXTENSION_MS
)

export const { leaseClient, releaseClient } = createClientPoolHelpers<PublicClient>(cache, urls => {
  const list = Array.isArray(urls) ? urls : [urls]
  return createPublicClient({
    chain: urls === ETHEREUM_TESTNET_WS_URLS ? sepolia : mainnet,
    transport: fallback(list.map(url => webSocket(url)))
  })
})

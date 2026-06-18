// Contains basic Utils for scripts that pull data for Assets and XCM pallets maps

import { decAnyMetadata, unifyMetadata } from '@polkadot-api/substrate-bindings'
import type { PolkadotClient } from 'polkadot-api'
import { createWsClient } from 'polkadot-api/ws'
import { getChainProviders } from '../../sdk-core/src'
import type { TSubstrateChain } from '../src'
import { readFileSync, writeFileSync } from 'fs'

export const readJsonOrReturnEmptyObject = (path: string) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (_e) {
    return {}
  }
}

export const withTimeout = async <T>(
  promise: Promise<T>,
  ms: number,
  label?: string
): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error(`Timed out after ${ms}ms${label ? ` (${label})` : ''}`)),
        ms
      )
    })
    return await Promise.race([promise, timeout])
  } finally {
    clearTimeout(timer)
  }
}

export const createChainClient = (chain: TSubstrateChain) =>
  createWsClient(getChainProviders(chain))

export const CHAIN_TIMEOUT_MS = 30_000

export const fetchFromChain = async <T>(
  chain: TSubstrateChain,
  fn: (client: PolkadotClient) => Promise<T>,
  timeoutMs = CHAIN_TIMEOUT_MS
): Promise<T | null> => {
  const client = createChainClient(chain)
  try {
    return await withTimeout(fn(client), timeoutMs, chain)
  } catch (e) {
    console.error(`Data for ${chain} could not be fetched`, e)
    return null
  } finally {
    client.destroy()
  }
}

export const getChainMetadataFlags = async (client: PolkadotClient) => {
  const { hash } = await client.getFinalizedBlock()
  const meta = unifyMetadata(decAnyMetadata(await client.getMetadata(hash)))
  const hasApi = (name: string) => meta.apis.some(a => a.name === name)
  return {
    isEVM: meta.lookup[0]?.path?.includes('AccountId20') ?? false,
    supportsDryRunApi: hasApi('DryRunApi'),
    supportsXcmPaymentApi: hasApi('XcmPaymentApi')
  }
}

export const writeJsonSync = (path: string, data: unknown) => {
  const TAB_WIDTH = 2
  const json = JSON.stringify(data, null, TAB_WIDTH) + '\n'
  writeFileSync(path, json)
}

export const filterRequestedChains = <T>(
  items: readonly T[],
  getChain: (item: T) => string
): readonly T[] => {
  const requested = process.argv.slice(2)
  if (requested.length === 0) return items

  const known = new Set(items.map(getChain))
  const unknown = requested.filter(chain => !known.has(chain))
  if (unknown.length > 0) {
    console.error(`Unknown chain(s): ${unknown.join(', ')}`)
    process.exit(1)
  }

  const wanted = new Set(requested)
  return items.filter(item => wanted.has(getChain(item)))
}

export const handleDataFetching = async <T1, T2>(
  filePath: string,
  fetchFunc: (obj: T1) => Promise<T2>,
  successMsg: string
) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const existingData = await readJsonOrReturnEmptyObject(filePath)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const data = (await fetchFunc(existingData)) as T2
  writeJsonSync(filePath, data)
  console.log(successMsg)
  process.exit()
}

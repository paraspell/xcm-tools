// Contains basic Utils for scripts that pull data for Assets and XCM pallets maps

import * as fs from 'fs'
import { ApiPromise, WsProvider } from '@polkadot/api'
import type { TNodeDotKsmWithRelayChains } from '../src/types'
import { getNodeProviders } from '../src/nodes/config'

export const readJsonOrReturnEmptyObject = (path: string) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return JSON.parse(fs.readFileSync(path, 'utf8'))
  } catch (_e) {
    return {}
  }
}

export const checkForNodeJsEnvironment = () => {
  if (typeof process !== 'object') {
    throw new TypeError('This script can only be executed in Node.JS environment')
  }
}

export const fetchTryMultipleProviders = <T>(
  node: TNodeDotKsmWithRelayChains,
  fetcher: (wsUrl: string) => T
): T | null => {
  const providers = getNodeProviders(node)
  for (const provider of providers) {
    try {
      console.log(`Trying ${provider}...`)
      return fetcher(provider)
    } catch (_e) {
      console.log(`Error fetching data from ${provider}. Trying from another RPC endpoint`)
    }
  }
  console.error(`Data for ${node} could not be fetched from any endpoint`)
  return null
}

export const fetchWithTimeout = async <T>(
  wsUrl: string,
  fetcher: (api: ApiPromise) => T
): Promise<T | null> => {
  const TIMEOUT_MS = 10000
  try {
    return await new Promise<T>((resolve, reject) => {
      const wsProvider = new WsProvider(wsUrl)

      const timeoutHandle = setTimeout(() => {
        void wsProvider.disconnect()
        reject(new Error('Timed out'))
      }, TIMEOUT_MS)

      ApiPromise.create({ provider: wsProvider })
        .then(api => fetcher(api))
        .then(result => {
          clearTimeout(timeoutHandle)
          resolve(result)
        })
        .catch(reject)
    })
  } catch (error) {
    console.error('Error occurred:', error)
    return null
  }
}

export const fetchTryMultipleProvidersWithTimeout = async <T>(
  node: TNodeDotKsmWithRelayChains,
  fetcher: (api: ApiPromise) => T
) => {
  return fetchTryMultipleProviders(node, async wsUrl => {
    return fetchWithTimeout(wsUrl, api => fetcher(api))
  })
}

export const writeJsonSync = (path: string, data: unknown) => {
  const TAB_WIDTH = 2
  fs.writeFileSync(path, JSON.stringify(data, null, TAB_WIDTH))
}

export const handleDataFetching = async <T1, T2>(
  filePath: string,
  fetchFunc: (obj: T1) => Promise<T2>,
  successMsg: string
) => {
  checkForNodeJsEnvironment()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const existingData = await readJsonOrReturnEmptyObject(filePath)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const data = (await fetchFunc(existingData)) as T2
  writeJsonSync(filePath, data)
  console.log(successMsg)
  process.exit()
}

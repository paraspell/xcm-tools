// Contains basic Utils for scripts that pull data for Assets and XCM pallets maps

import * as fs from 'fs'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { type TNodePolkadotKusama } from '../src/types'
import { getAllNodeProviders, getNodeProvider } from '../src/utils'

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
  node: TNodePolkadotKusama,
  fetcher: (wsUrl: string) => T
): T | null => {
  const providers = (() => {
    try {
      return getAllNodeProviders(node)
    } catch (_e) {
      console.log(`Error retrieving all providers. Using default provider.`)
      return [getNodeProvider(node)]
    }
  })()
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
  const TIMEOUT_MS = 60000
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
  node: TNodePolkadotKusama,
  fetcher: (api: ApiPromise) => T
) => {
  return await fetchTryMultipleProviders(node, async wsUrl => {
    return await fetchWithTimeout(wsUrl, api => fetcher(api))
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const writeJsonSync = (path: string, data: any) => {
  const TAB_WIDTH = 2
  fs.writeFileSync(path, JSON.stringify(data, null, TAB_WIDTH))
}

export const handleDataFetching = async <T1, T2>(
  filePath: string,
  fetchFunc: (obj: T1) => Promise<T2>,
  successMsg: string,
  transformFunc?: (data: T2) => T2
) => {
  checkForNodeJsEnvironment()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const existingData = await readJsonOrReturnEmptyObject(filePath)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  let data = (await fetchFunc(existingData)) as T2
  if (transformFunc) {
    data = transformFunc(data)
  }
  writeJsonSync(filePath, data)
  console.log(successMsg)
  process.exit()
}

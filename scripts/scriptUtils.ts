// Contains basic Utils for scripts that pull data for Assets and XCM pallets maps

import * as fs from 'fs'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { type TNode } from '../src/types'
import { getAllNodeProviders } from '../src/utils'

export const readJsonOrReturnEmptyObject = (path: string) => {
  try {
    return JSON.parse(fs.readFileSync(path, 'utf8'))
  } catch (e) {
    return {}
  }
}

export const checkForNodeJsEnvironment = () => {
  if (typeof process !== 'object') {
    throw new TypeError('This script can only be executed in Node.JS environment')
  }
}

export const fetchTryMultipleProviders = async <T>(
  node: TNode,
  fetcher: (wsUrl: string) => T
): Promise<T | null> => {
  const providers = getAllNodeProviders(node)
  for (const provider of providers) {
    try {
      console.log(`Trying ${provider}...`)
      return fetcher(provider)
    } catch (e) {
      console.log(`Error fetching data from ${provider}. Trying from another RPC endpoint`)
    }
  }
  console.error(`Data for ${node} could not be fetched from any endpoint`)
  return null
}

export const fetchWithTimeout = async <T>(wsUrl: string, fetcher: (api: ApiPromise) => T): Promise<T> => {
  const TIMEOUT_MS = 60000
  return await new Promise((resolve, reject) => {
    const wsProvider = new WsProvider(wsUrl)

    setTimeout(() => {
      wsProvider.disconnect()
      reject(new Error('Timed out'))
    }, TIMEOUT_MS)

    ApiPromise.create({ provider: wsProvider })
      .then(api => fetcher(api))
      .then(resolve)
  })
}

export const fetchTryMultipleProvidersWithTimeout = async <T>(
  node: TNode,
  fetcher: (api: ApiPromise) => T
) => {
  return await fetchTryMultipleProviders(node, async wsUrl => {
    return await fetchWithTimeout(wsUrl, api => fetcher(api))
  })
}

export const writeJsonSync = (path: string, data: any) => {
  fs.writeFileSync(path, JSON.stringify(data, null, 4))
}

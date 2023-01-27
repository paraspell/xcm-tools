import * as fs from 'fs'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { TNode } from '../types'
import { getNodeEndpointOption } from '../utils'

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

export const getNodeProviders = (node: TNode) => {
  const { providers } = getNodeEndpointOption(node) ?? {}
  return Object.values(providers ?? [])
}

export const fetchTryMultipleProviders = async <T>(
  node: TNode,
  fetcher: (wsUrl: string) => T
): Promise<T | null> => {
  const providers = getNodeProviders(node)
  for (const provider of providers) {
    try {
      console.log(`Trying ${provider}...`)
      return await fetcher(provider)
    } catch (e) {
      console.log(`Error fetching data from ${provider}. Trying from another RPC endpoint`)
    }
  }
  console.error(`Data for ${node} could not be fetched from any endpoint`)
  return null
}

export const fetchWithTimeout = <T>(wsUrl: string, fetcher: (api: ApiPromise) => T): Promise<T> => {
  const TIMEOUT_MS = 60000
  return new Promise((resolve, reject) => {
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

export const fetchTryMultipleProvidersWithTimeout = <T>(
  node: TNode,
  fetcher: (api: ApiPromise) => T
) => {
  return fetchTryMultipleProviders(node, wsUrl => {
    return fetchWithTimeout(wsUrl, api => fetcher(api))
  })
}

export const writeJsonSync = (path: string, data: any) => {
  fs.writeFileSync(path, JSON.stringify(data, null, 4))
}

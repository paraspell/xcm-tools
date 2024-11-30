/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { ApiPromise } from '@polkadot/api'
import type {
  TAssetJsonMap,
  TForeignAsset,
  TMultiLocation,
  TNativeAsset,
  TNode,
  TNodeAssets,
  TNodePolkadotKusama
} from '../../src/types'
import { getNode } from '../../src/utils'
import { fetchTryMultipleProvidersWithTimeout } from '../scriptUtils'
import { GLOBAL, nodeToQuery } from './nodeToQueryMap'
import { fetchEthereumAssets } from './fetchEthereumAssets'
import { addAliasesToDuplicateSymbols } from './addAliases'
import { capitalizeMultiLocation, fetchOtherAssetsRegistry } from './fetchOtherAssetsRegistry'
import { isNodeEvm } from './isNodeEvm'

const fetchNativeAssets = async (api: ApiPromise): Promise<TNativeAsset[]> => {
  const propertiesRes = await api.rpc.system.properties()
  const json = propertiesRes.toHuman()
  const symbols = json.tokenSymbol as string[]
  const decimals = json.tokenDecimals as string[]
  return symbols.map((symbol, i) => ({
    symbol,
    decimals: decimals[i] ? +decimals[i] : +decimals[0]
  }))
}

const fetchOtherAssets = async (api: ApiPromise, query: string): Promise<TForeignAsset[]> => {
  const [module, section] = query.split('.')
  const res = await api.query[module][section].entries()

  return res
    .map(
      ([
        {
          args: [era]
        },
        value
      ]) => {
        const { symbol, decimals } = value.toHuman() as any
        return {
          assetId: era.toString(),
          symbol,
          decimals: +decimals
        }
      }
    )
    .filter(asset => asset.symbol !== null)
}

const fetchNativeAssetsCurio = async (api: ApiPromise, query: string) => {
  const [module, section] = query.split('.')
  const res = await api.query[module][section].entries()
  return res
    .map(
      ([
        {
          args: [era]
        },
        value
      ]) => {
        const { symbol, decimals } = value.toHuman() as any
        return {
          assetId: era.toHuman(),
          symbol,
          decimals: +decimals
        }
      }
    )
    .filter(asset => Object.keys(asset.assetId ?? {})[0] === 'Token')
    .map(asset => ({
      symbol: asset.symbol,
      decimals: asset.decimals
    }))
}

const fetchOtherAssetsCurio = async (api: ApiPromise, query: string) => {
  const [module, section] = query.split('.')
  const res = await api.query[module][section].entries()
  return res
    .map(
      ([
        {
          args: [era]
        },
        value
      ]) => {
        const { symbol, decimals } = value.toHuman() as any
        return {
          assetId: era.toHuman(),
          symbol,
          decimals: +decimals
        }
      }
    )
    .filter(asset => Object.keys(asset.assetId ?? {})[0] === 'ForeignAsset')
    .map(asset => ({
      assetId: Object.values(asset.assetId ?? {})[0],
      symbol: asset.symbol,
      decimals: asset.decimals
    }))
}

const fetchOtherAssetsAmplitude = async (api: ApiPromise, query: string) => {
  const [module, section] = query.split('.')
  const res = await api.query[module][section].entries()
  return res
    .filter(
      ([
        {
          args: [era]
        }
      ]) => Object.prototype.hasOwnProperty.call(era.toHuman(), 'XCM')
    )
    .map(
      ([
        {
          args: [era]
        },
        value
      ]) => {
        const { symbol, decimals } = value.toHuman() as any
        return {
          assetId: Object.values(era.toHuman() ?? {})[0].replaceAll(',', ''),
          symbol,
          decimals: +decimals
        }
      }
    )
}

const fetchOtherAssetsInnerType = async (api: ApiPromise, query: string) => {
  const [module, section] = query.split('.')
  const symbolsResponse = await api.query[module][section].entries()
  const assetsWithoutDecimals = symbolsResponse.map(
    ([
      {
        args: [era]
      },
      value
    ]) => {
      const { inner: symbol } = value.toHuman() as any
      const assetId = era.toHuman() as string
      const numberAssetId = assetId.replace(/[,]/g, '')
      return {
        assetId: numberAssetId,
        symbol
      }
    }
  )
  const decimalsResponse = await api.query[module].assetDecimals.entries()
  const assetsWithoutSymbols = decimalsResponse.map(
    ([
      {
        args: [era]
      },
      value
    ]) => {
      const assetId = era.toHuman() as string
      const numberAssetId = assetId.replace(/[,]/g, '')
      return { assetId: numberAssetId, decimals: +(value.toHuman() as number) }
    }
  )

  return assetsWithoutDecimals
    .map(assetWithoutDecimals => {
      const matchingAsset = assetsWithoutSymbols.find(
        assetWithoutSymbols => assetWithoutSymbols.assetId === assetWithoutDecimals.assetId
      )
      return matchingAsset ? { ...assetWithoutDecimals, decimals: matchingAsset.decimals } : null
    })
    .filter(asset => asset !== null) as unknown as TForeignAsset[]
}

const fetchAssetsType2 = async (api: ApiPromise, query: string): Promise<Partial<TNodeAssets>> => {
  const [module, section] = query.split('.')
  const res = await api.query[module][section].entries()

  const nativeAssets = res
    .filter(
      ([
        {
          args: [era]
        }
      ]) => Object.prototype.hasOwnProperty.call(era.toHuman(), 'NativeAssetId')
    )
    .map(([, value]) => {
      const { symbol, decimals } = value.toHuman() as any
      return { symbol, decimals: +decimals }
    })

  const otherAssets = res
    .filter(
      ([
        {
          args: [era]
        }
      ]) => !Object.prototype.hasOwnProperty.call(era.toHuman(), 'NativeAssetId')
    )
    .map(
      ([
        {
          args: [era]
        },
        value
      ]) => {
        const { symbol, decimals } = value.toHuman() as any
        return {
          assetId: Object.values(era.toHuman() ?? {})[0],
          symbol,
          decimals: +decimals
        }
      }
    )

  return { nativeAssets, otherAssets }
}

const fetchNativeAsset = async (api: ApiPromise): Promise<string> => {
  const propertiesRes = await api.rpc.system.properties()
  const json = propertiesRes.toHuman()
  const symbols = json.tokenSymbol as string[]
  return symbols[0]
}

const fetchMultiLocations = async (api: ApiPromise): Promise<TForeignAsset[]> => {
  const res = await api.query.foreignAssets.metadata.entries()
  return res.map(
    ([
      {
        args: [era]
      },
      value
    ]) => {
      const multiLocation = era.toJSON() ?? {}
      const { symbol, decimals } = value.toHuman() as any
      return {
        symbol,
        decimals: +decimals,
        multiLocation: multiLocation as object
      }
    }
  )
}

const fetchNodeAssets = async (
  node: TNodePolkadotKusama,
  api: ApiPromise,
  query: string | null
): Promise<Partial<TNodeAssets>> => {
  const nativeAssetSymbol = await fetchNativeAsset(api)

  if (node === 'Zeitgeist') {
    const nativeAssets = (await fetchNativeAssets(api)) ?? []
    const { otherAssets } = (await fetchAssetsType2(api, query!)) ?? []
    await api.disconnect()
    return {
      nativeAssets,
      otherAssets,
      nativeAssetSymbol
    }
  }
  if (node === 'Amplitude') {
    const nativeAssets = (await fetchNativeAssets(api)) ?? []
    const otherAssets = query ? await fetchOtherAssetsAmplitude(api, query) : []
    await api.disconnect()
    return {
      nativeAssets,
      otherAssets,
      nativeAssetSymbol
    }
  }

  // Different format of data
  if (node === 'Curio') {
    const nativeAssets = query ? await fetchNativeAssetsCurio(api, query) : []
    const otherAssets = query ? await fetchOtherAssetsCurio(api, query) : []
    await api.disconnect()
    return {
      nativeAssets,
      otherAssets,
      nativeAssetSymbol
    }
  }

  if (node === 'Picasso' || node === 'ComposableFinance') {
    const nativeAssets = (await fetchNativeAssets(api)) ?? []
    const otherAssets = query ? await fetchOtherAssetsInnerType(api, query) : []
    await api.disconnect()
    return {
      nativeAssets,
      otherAssets,
      nativeAssetSymbol
    }
  }

  const nativeAssets = (await fetchNativeAssets(api)) ?? []

  let otherAssets: TForeignAsset[]

  try {
    otherAssets =
      query === GLOBAL
        ? await fetchOtherAssetsRegistry(node)
        : typeof query === 'string'
          ? await fetchOtherAssets(api, query)
          : []
  } catch (e) {
    console.warn(`Failed to fetch other assets for ${node}: ${e.message}`)
    otherAssets = []
  }

  const isAssetHub = node === 'AssetHubPolkadot' || node === 'AssetHubKusama'

  if (isAssetHub) {
    const foreignAssets = await fetchMultiLocations(api)
    const transformedForeignAssets = foreignAssets.map(asset => {
      return {
        ...asset,
        multiLocation: asset.multiLocation
          ? (capitalizeMultiLocation(asset.multiLocation) as TMultiLocation)
          : undefined
      } as TForeignAsset
    })
    otherAssets.push(...transformedForeignAssets)
  }

  await api.disconnect()

  return {
    nativeAssets,
    otherAssets,
    nativeAssetSymbol,
    isEVM: isNodeEvm(api)
  }
}

export const fetchAllNodesAssets = async (assetsMapJson: any) => {
  const output: TAssetJsonMap = JSON.parse(JSON.stringify(assetsMapJson))
  for (const [node, query] of Object.entries(nodeToQuery)) {
    const nodeName = node as TNode

    console.log(`Fetching assets for ${nodeName}...`)

    let newData

    if (nodeName === 'Ethereum') {
      newData = await fetchEthereumAssets()
      output[nodeName] = newData
    } else {
      newData = await fetchTryMultipleProvidersWithTimeout(nodeName as TNodePolkadotKusama, api =>
        fetchNodeAssets(nodeName as TNodePolkadotKusama, api, query)
      )

      const isError = newData === null
      const oldData = output[nodeName] ?? null

      if (isError && oldData) {
        // If fetching new data fails, keep existing data
        output[nodeName] = oldData
      } else {
        // Append manually added assets from oldData to newData
        const manuallyAddedNativeAssets =
          oldData?.nativeAssets?.filter(asset => asset.manuallyAdded) ?? []
        const manuallyAddedOtherAssets =
          oldData?.otherAssets?.filter(asset => asset.manuallyAdded) ?? []

        const combinedNativeAssets = [
          ...(newData?.nativeAssets ?? []),
          ...manuallyAddedNativeAssets
        ]
        const combinedOtherAssets = [...(newData?.otherAssets ?? []), ...manuallyAddedOtherAssets]

        output[nodeName] = {
          relayChainAssetSymbol: getNode(nodeName).type === 'polkadot' ? 'DOT' : 'KSM',
          nativeAssetSymbol: newData?.nativeAssetSymbol ?? '',
          isEVM: newData?.isEVM ?? false,
          nativeAssets: combinedNativeAssets,
          otherAssets: combinedOtherAssets
        }
      }
    }
  }

  return addAliasesToDuplicateSymbols(output)
}

/* eslint-disable no-prototype-builtins */
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
import { fetchBifrostForeignAssets, fetchBifrostNativeAssets } from './fetchBifrostAssets'
import { fetchOtherAssetsCentrifuge } from './fetchAssetsCentrifuge'
import { fetchExistentialDeposit } from './fetchEd'
import { fetchAcalaForeignAssets, fetchAcalaNativeAssets } from './fetchAcalaAssets'
import { getNativeAssetSymbol } from '../../src/pallets/assets'
import { fetchComposableAssets } from './fetchComposableAssets'
import { fetchPendulumForeignAssets } from './fetchPendulumAssets'
import { fetchMoonbeamForeignAssets } from './fetchMoonbeamAssets'
import { supportsDryRunApi } from './supportsDryRunApi'

const fetchNativeAssetsDefault = async (api: ApiPromise): Promise<TNativeAsset[]> => {
  const propertiesRes = await api.rpc.system.properties()
  const json = propertiesRes.toHuman()
  const symbols = json.tokenSymbol as string[]
  const decimals = json.tokenDecimals as string[]
  return symbols.map((symbol, i) => ({
    symbol,
    decimals: decimals[i] ? +decimals[i] : +decimals[0],
    existentialDeposit: fetchExistentialDeposit(api) ?? '0'
  }))
}

const fetchNativeAssets = async (
  node: TNodePolkadotKusama,
  api: ApiPromise,
  query: string
): Promise<TNativeAsset[]> => {
  let nativeAssets: TNativeAsset[] = []

  if (node === 'Curio') {
    nativeAssets = await fetchNativeAssetsCurio(api, query)
  }

  if (node === 'BifrostPolkadot' || node === 'BifrostKusama') {
    nativeAssets = await fetchBifrostNativeAssets(api, query)
  }

  if (node === 'Acala' || node === 'Karura') {
    nativeAssets = await fetchAcalaNativeAssets(api, query)
  }

  const transformed = nativeAssets.length > 0 ? nativeAssets : await fetchNativeAssetsDefault(api)

  const nativeSymbol = getNativeAssetSymbol(node)

  const reordered = transformed.sort((a, b) => {
    if (a.symbol === nativeSymbol) return -1
    if (b.symbol === nativeSymbol) return 1
    return 0
  })

  return reordered.map(asset => ({
    ...asset,
    existentialDeposit: asset.existentialDeposit?.replace(/,/g, '')
  }))
}

const fetchOtherAssetsDefault = async (
  node: TNodePolkadotKusama,
  api: ApiPromise,
  query: string
): Promise<TForeignAsset[]> => {
  const [module, section] = query.split('.')

  const res = await api.query[module][section].entries()

  const results = await Promise.all(
    res.map(
      async ([
        {
          args: [era]
        },
        value
      ]) => {
        const valueHuman = value.toHuman()
        const resDetail =
          api.query[module] && api.query[module].hasOwnProperty('asset')
            ? await api.query[module].asset(era)
            : undefined
        const resDetail2 =
          node === 'Basilisk' ? await api.query.assetRegistry.assets(era) : undefined

        return {
          assetId: era.toString(),
          symbol: valueHuman.symbol,
          decimals: +valueHuman.decimals,
          existentialDeposit:
            valueHuman.existentialDeposit ??
            valueHuman.minimalBalance ??
            (resDetail?.toHuman() as any)?.existentialDeposit ??
            (resDetail?.toHuman() as any)?.minBalance ??
            (resDetail?.toHuman() as any)?.minimalBalance ??
            (resDetail2?.toHuman() as any)?.existentialDeposit
        }
      }
    )
  )
  return results.filter(asset => asset.symbol !== null)
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
        const { symbol, decimals, existentialDeposit } = value.toHuman()
        return {
          assetId: era.toHuman(),
          symbol,
          decimals: +decimals,
          existentialDeposit
        }
      }
    )
    .filter(asset => Object.keys(asset.assetId ?? {})[0] === 'Token')
    .map(asset => ({
      symbol: asset.symbol,
      decimals: asset.decimals,
      existentialDeposit: asset.existentialDeposit
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
        const { symbol, decimals, existentialDeposit } = value.toHuman()
        return {
          assetId: era.toHuman(),
          symbol,
          decimals: +decimals,
          existentialDeposit
        }
      }
    )
    .filter(asset => Object.keys(asset.assetId ?? {})[0] === 'ForeignAsset')
    .map(asset => ({
      assetId: Object.values(asset.assetId ?? {})[0],
      symbol: asset.symbol,
      decimals: asset.decimals,
      existentialDeposit: asset.existentialDeposit
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
        const { symbol, decimals, existentialDeposit } = value.toHuman()
        return {
          assetId: Object.values(era.toHuman() ?? {})[0].replaceAll(',', ''),
          symbol,
          decimals: +decimals,
          existentialDeposit
        }
      }
    )
}

const fetchNativeAsset = async (api: ApiPromise): Promise<string> => {
  const propertiesRes = await api.rpc.system.properties()
  const json = propertiesRes.toHuman()
  const symbols = json.tokenSymbol as string[]
  return symbols[0]
}

const fetchMultiLocations = async (api: ApiPromise): Promise<TForeignAsset[]> => {
  const res = await api.query.foreignAssets.metadata.entries()

  const results = await Promise.all(
    res.map(
      async ([
        {
          args: [era]
        },
        value
      ]) => {
        const multiLocation = era.toJSON() ?? {}
        const resDetail = await api.query.foreignAssets.asset(era)
        const { symbol, decimals } = value.toHuman()

        return {
          symbol,
          decimals: +decimals,
          multiLocation: multiLocation as object,
          existentialDeposit: (resDetail.toHuman() as any).minBalance.replace(/,/g, '')
        }
      }
    )
  )

  return results
}

const fetchOtherAssets = async (
  node: TNodePolkadotKusama,
  api: ApiPromise,
  query: string
): Promise<TForeignAsset[]> => {
  let otherAssets: TForeignAsset[] = []
  if (node === 'Zeitgeist' || node === 'Acala' || node === 'Karura') {
    otherAssets = await fetchAcalaForeignAssets(api, query)
  }

  if (node === 'Amplitude') {
    otherAssets = await fetchOtherAssetsAmplitude(api, query)
  }

  if (node === 'Curio') {
    otherAssets = await fetchOtherAssetsCurio(api, query)
  }

  if (node === 'Picasso' || node === 'ComposableFinance') {
    otherAssets = await fetchComposableAssets(api, query)
  }

  if (node === 'BifrostPolkadot' || node === 'BifrostKusama') {
    otherAssets = await fetchBifrostForeignAssets(api, query)
  }

  if (node === 'Centrifuge' || node === 'Altair') {
    otherAssets = await fetchOtherAssetsCentrifuge(api, query)
  }

  if (node === 'Pendulum') {
    otherAssets = await fetchPendulumForeignAssets(api, query)
  }

  if (node === 'Moonbeam' || node === 'Moonriver') {
    otherAssets = await fetchMoonbeamForeignAssets(api, query)
  }

  return otherAssets.length > 0 ? otherAssets : fetchOtherAssetsDefault(node, api, query)
}

const fetchNodeAssets = async (
  node: TNodePolkadotKusama,
  api: ApiPromise,
  query: string[]
): Promise<Partial<TNodeAssets>> => {
  const nativeAssetSymbol = await fetchNativeAsset(api)

  const hasGlobal = query.includes(GLOBAL)
  const queryPath = hasGlobal ? query[1] : query[0]

  let globalOtherAssets: TForeignAsset[] = []
  let queryOtherAssets: TForeignAsset[] = []

  if (hasGlobal) {
    globalOtherAssets = await fetchOtherAssetsRegistry(node)
  }

  if (queryPath) {
    queryOtherAssets = await fetchOtherAssets(node, api, queryPath)
  }

  let mergedAssets = globalOtherAssets.map(globalAsset => {
    const matchingQueryAsset = queryOtherAssets.find(
      queryAsset => queryAsset.assetId === globalAsset.assetId
    )
    return matchingQueryAsset
      ? {
          ...globalAsset,
          existentialDeposit: matchingQueryAsset.existentialDeposit?.replace(/,/g, '')
        }
      : globalAsset
  })

  if (mergedAssets.length === 0 && queryOtherAssets.length > 0) {
    mergedAssets.push(
      ...queryOtherAssets.map(asset => ({
        ...asset,
        existentialDeposit: asset.existentialDeposit?.replace(/,/g, '')
      }))
    )
  }

  const nativeAssets = (await fetchNativeAssets(node, api, queryPath)) ?? []

  const isAssetHub = node === 'AssetHubPolkadot' || node === 'AssetHubKusama'

  if (isAssetHub) {
    const foreignAssets = await fetchMultiLocations(api)

    const transformedForeignAssets = foreignAssets.map(asset => ({
      ...asset,
      multiLocation: asset.multiLocation
        ? (capitalizeMultiLocation(asset.multiLocation) as TMultiLocation)
        : undefined
    })) as TForeignAsset[]

    // Add transformed foreign assets to the merged list
    mergedAssets.push(...transformedForeignAssets)

    // Check for unmatched assets by ID and attempt to match by symbol
    const unmatchedAssets = queryOtherAssets.filter(
      queryAsset => !mergedAssets.some(asset => asset.assetId === queryAsset.assetId)
    )

    if (unmatchedAssets.length > 0) {
      const symbolMatches = unmatchedAssets.filter(queryAsset =>
        mergedAssets.some(asset => asset.symbol === queryAsset.symbol)
      )

      mergedAssets.push(
        ...symbolMatches.map(asset => ({
          ...asset,
          existentialDeposit: asset.existentialDeposit?.replace(/,/g, '')
        }))
      )
    }

    mergedAssets = mergedAssets.filter(asset => asset.multiLocation || asset.xcmInterior)
  }

  mergedAssets = mergedAssets.filter(asset => asset.assetId !== 'Native')

  await api.disconnect()

  return {
    nativeAssets,
    otherAssets: mergedAssets,
    nativeAssetSymbol,
    isEVM: isNodeEvm(api),
    supportsDryRunApi: supportsDryRunApi(api)
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
          supportsDryRunApi: newData?.supportsDryRunApi ?? false,
          nativeAssets: combinedNativeAssets,
          otherAssets: combinedOtherAssets
        }
      }
    }
  }

  return addAliasesToDuplicateSymbols(output)
}

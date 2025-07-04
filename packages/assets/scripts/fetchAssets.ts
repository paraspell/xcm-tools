/* eslint-disable no-prototype-builtins */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { ApiPromise } from '@polkadot/api'
import {
  findAssetByMultiLocation,
  getNativeAssetSymbol,
  type TAssetJsonMap,
  type TForeignAsset,
  type TNativeAsset,
  type TNodeAssets
} from '../src'
import { fetchTryMultipleProvidersWithTimeout } from '../../sdk-common/scripts/scriptUtils'
import { GLOBAL, nodeToQuery } from './nodeToQueryMap'
import { fetchEthereumAssets } from './fetchEthereumAssets'
import { addAliasesToDuplicateSymbols } from './addAliases'
import { capitalizeMultiLocation, fetchOtherAssetsRegistry } from './fetchOtherAssetsRegistry'
import { isNodeEvm } from './isNodeEvm'
import { fetchBifrostForeignAssets, fetchBifrostNativeAssets } from './fetchBifrostAssets'
import { fetchOtherAssetsCentrifuge } from './fetchAssetsCentrifuge'
import { fetchExistentialDeposit } from './fetchEd'
import { fetchAcalaForeignAssets, fetchAcalaNativeAssets } from './fetchAcalaAssets'
import { fetchComposableAssets } from './fetchComposableAssets'
import { fetchPendulumForeignAssets } from './fetchPendulumAssets'
import { fetchMoonbeamForeignAssets } from './fetchMoonbeamAssets'
import { supportsRuntimeApi } from './supportsRuntimeApi'
import { fetchUniqueForeignAssets } from './fetchUniqueAssets'
import { fetchXcmRegistry, TRegistryAssets } from './fetchXcmRegistry'
import { fetchPolimecForeignAssets } from './fetchPolimecAssets'
import {
  isRelayChain,
  Parents,
  TMultiLocation,
  TNodePolkadotKusama,
  TNodeWithRelayChains
} from '@paraspell/sdk-common'
import { getNodeProviders, getParaId, reverseTransformMultiLocation } from '../../sdk-core/src'
import { getRelayChainSymbolOf, getChainEcosystem } from './utils'
import { fetchAjunaOtherAssets } from './fetchAjunaAssets'
import { fetchFeeAssets } from './fetchFeeAssets'
import { fetchMantaOtherAssets } from './fetchMantaAssets'
import { fetchHydrationOtherAssets } from './fetchHydrationAssets'

const fetchNativeAssetsDefault = async (api: ApiPromise): Promise<TNativeAsset[]> => {
  const propertiesRes = await api.rpc.system.properties()
  const json = propertiesRes.toHuman()
  const symbols = json.tokenSymbol as string[]
  const decimals = json.tokenDecimals as string[]
  return symbols.map((symbol, i) => ({
    symbol,
    isNative: true,
    decimals: decimals[i] ? +decimals[i] : +decimals[0],
    existentialDeposit: fetchExistentialDeposit(api) ?? '0'
  }))
}

const resolveNativeAssets = async (
  chain: TNodePolkadotKusama,
  api: ApiPromise
): Promise<TNativeAsset[]> => {
  if (chain === 'Penpal') {
    return [
      {
        symbol: await resolveNativeAsset(chain, api),
        isNative: true,
        decimals: 12,
        existentialDeposit: '1'
      }
    ]
  }
  return fetchNativeAssetsDefault(api)
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

  if (node.includes('Bifrost')) {
    nativeAssets = await fetchBifrostNativeAssets(api, query)
  }

  if (node === 'Acala' || node === 'Karura' || node === 'Jamton') {
    nativeAssets = await fetchAcalaNativeAssets(
      api,
      query,
      node === 'Jamton' ? 'Native' : undefined
    )
  }

  const transformed = nativeAssets.length > 0 ? nativeAssets : await resolveNativeAssets(node, api)

  const nativeSymbol = getNativeAssetSymbol(node)

  const reordered = transformed.sort((a, b) => {
    if (a.symbol === nativeSymbol) return -1
    if (b.symbol === nativeSymbol) return 1
    return 0
  })

  const data = await fetchXcmRegistry()

  const paraId = getParaId(node)
  const relay = getChainEcosystem(node)

  const assets = data.assets[relay]?.find(item => item.paraID === paraId)?.data as
    | TRegistryAssets[]
    | undefined

  const assetsRegistry = data.xcmRegistry.find(item => item.relayChain === relay)?.data

  const cleanAsset = (asset: TNativeAsset, multiLocation?: any): TNativeAsset => {
    let finalMultiLocation = multiLocation

    if (asset.symbol === nativeSymbol && !multiLocation) {
      finalMultiLocation = {
        parents: 1,
        interior: {
          X1: [{ Parachain: paraId }]
        }
      }
    }

    if (asset.symbol === getRelayChainSymbolOf(node) && !multiLocation) {
      finalMultiLocation = {
        parents: 1,
        interior: {
          Here: null
        }
      }
    }

    return {
      ...asset,
      isNative: true,
      existentialDeposit: asset.existentialDeposit?.replace(/,/g, ''),
      ...(finalMultiLocation && { multiLocation: capitalizeMultiLocation(finalMultiLocation) })
    }
  }

  return reordered.map(asset => {
    if (!assets || !assetsRegistry) return cleanAsset(asset)

    const match = assets.find(a => {
      const symbolMatch = a.symbol.toLowerCase() === asset.symbol.toLowerCase()

      // Needed for Astar to find the correct native asset as other asset
      // has the same symbol
      const astarCheck = node === 'Astar' ? a.currencyID === undefined : true
      return symbolMatch && astarCheck
    })

    const xcmKey = match?.xcmInteriorKey
    const registryAsset = xcmKey ? assetsRegistry[xcmKey] : null

    if (!registryAsset?.xcmV1MultiLocation) return cleanAsset(asset)
    return cleanAsset(asset, registryAsset.xcmV1MultiLocation.v1)
  })
}

const fetchOtherAssetsDefault = async (
  node: TNodePolkadotKusama,
  api: ApiPromise,
  query: string
): Promise<TForeignAsset[]> => {
  const [module, method] = query.split('.')

  const res = await api.query[module][method].entries()

  const results = await Promise.all(
    res.map(
      async ([
        {
          args: [era]
        },
        value
      ]) => {
        const valueHuman = value.toHuman() as any
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

const fetchNativeAssetsCurio = async (api: ApiPromise, query: string): Promise<TNativeAsset[]> => {
  const [module, method] = query.split('.')
  const res = await api.query[module][method].entries()
  return res
    .map(
      ([
        {
          args: [era]
        },
        value
      ]) => {
        const { symbol, decimals, existentialDeposit } = value.toHuman() as any
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
      isNative: true,
      symbol: asset.symbol,
      decimals: asset.decimals,
      existentialDeposit: asset.existentialDeposit
    }))
}

const fetchOtherAssetsCurio = async (api: ApiPromise, query: string) => {
  const [module, method] = query.split('.')
  const res = await api.query[module][method].entries()
  return res
    .map(
      ([
        {
          args: [era]
        },
        value
      ]) => {
        const { symbol, decimals, existentialDeposit } = value.toHuman() as any
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
  const [module, method] = query.split('.')
  const res = await api.query[module][method].entries()
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
        const { symbol, decimals, existentialDeposit } = value.toHuman() as any
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

const resolveNativeAsset = async (node: TNodePolkadotKusama, api: ApiPromise): Promise<string> => {
  // Return hardcoded value for Penpal because query returns null
  if (node === 'Penpal') return 'UNIT'
  return fetchNativeAsset(api)
}

const fetchMultiLocations = async (
  chain: TNodePolkadotKusama,
  api: ApiPromise
): Promise<TForeignAsset[]> => {
  const res = await api.query.foreignAssets.metadata.entries()

  const parseAsset = async (key: unknown, value: unknown): Promise<TForeignAsset> => {
    const era = (key as any).args[0]
    const multiLocation = era.toJSON() ?? {}
    const assetDetail = await api.query.foreignAssets.asset(era)
    const { symbol, decimals } = (value as any).toHuman()

    return {
      symbol,
      decimals: +decimals,
      multiLocation: multiLocation as unknown as TMultiLocation,
      existentialDeposit: (assetDetail.toHuman() as any).minBalance.replace(/,/g, '')
    }
  }

  const results = await Promise.all(res.map(([key, value]) => parseAsset(key, value)))

  const isAssetHub = chain === 'AssetHubPolkadot' || chain === 'AssetHubKusama'

  const buildEthereumMultiLocation = (address: string): TMultiLocation => ({
    parents: 2,
    interior: {
      X2: [
        { GlobalConsensus: { Ethereum: { chainId: 1 } } },
        { AccountKey20: { network: null, key: address } }
      ]
    }
  })

  // These assets are missing metadata, we need to add them manually
  const staticAssets = [
    {
      symbol: 'wstETH',
      decimals: 18,
      address: '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0'
    },
    {
      symbol: 'tBTC',
      decimals: 18,
      address: '0x18084fba666a33d37592fa2633fd49a74dd93a88'
    }
  ]

  if (isAssetHub) {
    for (const { symbol, decimals, address } of staticAssets) {
      const location = buildEthereumMultiLocation(address)
      const assetDetail = await api.query.foreignAssets.asset(location)

      if (assetDetail) {
        results.push({
          symbol,
          decimals,
          multiLocation: location,
          existentialDeposit: (assetDetail.toHuman() as any).minBalance.replace(/,/g, '')
        })
      }
    }
  }

  return results
}

const fetchOtherAssets = async (
  node: TNodePolkadotKusama,
  api: ApiPromise,
  query: string
): Promise<TForeignAsset[]> => {
  let otherAssets: TForeignAsset[] = []
  if (node.includes('Zeitgeist') || node === 'Acala' || node === 'Karura' || node === 'Jamton') {
    otherAssets = await fetchAcalaForeignAssets(
      api,
      query,
      node === 'Jamton' ? 'Native' : undefined
    )
  }

  if (node === 'Amplitude') {
    otherAssets = await fetchOtherAssetsAmplitude(api, query)
  }

  if (node === 'Curio') {
    otherAssets = await fetchOtherAssetsCurio(api, query)
  }

  if (node === 'ComposableFinance') {
    otherAssets = await fetchComposableAssets(api, query)
  }

  if (node.includes('Bifrost')) {
    otherAssets = await fetchBifrostForeignAssets(api, query)
  }

  if (node === 'Centrifuge' || node === 'Altair') {
    otherAssets = await fetchOtherAssetsCentrifuge(api, query)
  }

  if (node === 'Pendulum') {
    otherAssets = await fetchPendulumForeignAssets(api, query)
  }

  if (node === 'Moonbeam' || node === 'Moonriver') {
    otherAssets = await fetchMoonbeamForeignAssets(api, query, node)
  }

  if (node === 'Unique' || node === 'Quartz') {
    otherAssets = await fetchUniqueForeignAssets(api, query)
  }

  if (node === 'Polimec' || node.includes('Kilt') || node === 'Penpal') {
    otherAssets = await fetchPolimecForeignAssets(api, query)
  }

  if (node.includes('Ajuna')) {
    otherAssets = await fetchAjunaOtherAssets(api, query)
  }

  if (node === 'Manta') {
    otherAssets = await fetchMantaOtherAssets(api, query)
  }

  if (node === 'HydrationPaseo') {
    otherAssets = await fetchHydrationOtherAssets(api, query)
  }

  return otherAssets.length > 0 ? otherAssets : fetchOtherAssetsDefault(node, api, query)
}

const patchParents = (node: TNodePolkadotKusama, asset: TForeignAsset): TForeignAsset => {
  if (
    (node === 'Hydration' || node === 'BifrostPolkadot') &&
    (asset.symbol === 'ETH' || asset.symbol === 'KSM')
  ) {
    if (asset.multiLocation) {
      if ('parents' in asset.multiLocation) {
        return {
          ...asset,
          multiLocation: {
            ...asset.multiLocation,
            parents: Parents.TWO
          }
        }
      }
    }
  }
  return asset
}

const DEFAULT_SS58_PREFIX = 42

const fetchNodeAssets = async (
  node: TNodePolkadotKusama,
  api: ApiPromise,
  query: string[]
): Promise<Partial<TNodeAssets>> => {
  let ss58Prefix = DEFAULT_SS58_PREFIX
  try {
    ss58Prefix = +api.consts.system.ss58Prefix.toString()
  } catch (e) {
    console.warn(`[${node}] ss58Prefix unavailable - using default 42`, e)
  }

  const supportsXcmPaymentApi = supportsRuntimeApi(api, 'xcmPaymentApi')
  const feeAssets: TMultiLocation[] = supportsXcmPaymentApi ? await fetchFeeAssets(api) : []

  const nativeAssetSymbol = await resolveNativeAsset(node, api)

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

  const isAssetHub = node.includes('AssetHub')

  if (isAssetHub) {
    const foreignAssets = await fetchMultiLocations(node, api)

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

    mergedAssets = mergedAssets.filter(asset => asset.multiLocation)
  }

  mergedAssets = mergedAssets.filter(asset => asset.assetId !== 'Native')

  mergedAssets = mergedAssets.map(asset => patchParents(node, asset))

  if (feeAssets.length > 0) {
    const allAssets = [...nativeAssets, ...mergedAssets] as unknown as TForeignAsset[]

    feeAssets.forEach(loc => {
      const matched =
        findAssetByMultiLocation(allAssets, loc) ||
        findAssetByMultiLocation(allAssets, reverseTransformMultiLocation(loc))
      if (matched) {
        matched.isFeeAsset = true
      }
    })
  }

  await api.disconnect()

  return {
    nativeAssets,
    otherAssets: mergedAssets,
    nativeAssetSymbol,
    ss58Prefix,
    isEVM: isNodeEvm(api),
    supportsDryRunApi: supportsRuntimeApi(api, 'dryRunApi'),
    supportsXcmPaymentApi
  }
}

export const fetchAllNodesAssets = async (assetsMapJson: any) => {
  const output: TAssetJsonMap = JSON.parse(JSON.stringify(assetsMapJson))
  for (const [node, query] of Object.entries(nodeToQuery)) {
    const nodeName = node as TNodeWithRelayChains

    console.log(`Fetching assets for ${nodeName}...`)

    let newData

    if (nodeName === 'Ethereum') {
      newData = await fetchEthereumAssets()
      output[nodeName] = newData
    } else {
      newData = await fetchTryMultipleProvidersWithTimeout(
        nodeName as TNodePolkadotKusama,
        getNodeProviders,
        api => fetchNodeAssets(nodeName as TNodePolkadotKusama, api, query)
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
          relayChainAssetSymbol: getRelayChainSymbolOf(nodeName),
          nativeAssetSymbol: newData?.nativeAssetSymbol ?? '',
          isEVM: newData?.isEVM ?? false,
          ss58Prefix: newData?.ss58Prefix ?? DEFAULT_SS58_PREFIX,
          supportsDryRunApi: newData?.supportsDryRunApi ?? false,
          supportsXcmPaymentApi: newData?.supportsXcmPaymentApi ?? false,
          nativeAssets: combinedNativeAssets,
          otherAssets: isRelayChain(nodeName) ? [] : combinedOtherAssets
        }
      }
    }
  }

  return addAliasesToDuplicateSymbols(output)
}

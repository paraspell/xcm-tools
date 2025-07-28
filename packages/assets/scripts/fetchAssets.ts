/* eslint-disable no-prototype-builtins */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { ApiPromise } from '@polkadot/api'
import {
  findAssetInfoByLoc,
  getNativeAssetSymbol,
  type TAssetJsonMap,
  type TForeignAsset,
  type TNativeAsset,
  type TNodeAssets
} from '../src'
import { fetchTryMultipleProvidersWithTimeout } from '../../sdk-common/scripts/scriptUtils'
import { nodeToQuery } from './nodeToQueryMap'
import { fetchEthereumAssets } from './fetchEthereumAssets'
import { addAliasesToDuplicateSymbols } from './addAliases'
import { capitalizeLocation } from './utils'
import { fetchBifrostForeignAssets, fetchBifrostNativeAssets } from './fetchBifrostAssets'
import { fetchCentrifugeAssets } from './fetchCentrifugeAssets'
import { fetchExistentialDeposit } from './fetchEd'
import { fetchZeitgeistForeignAssets, fetchZeitgeistNativeAssets } from './fetchZeitgeistAssets'
import { fetchComposableAssets } from './fetchComposableAssets'
import { fetchPendulumForeignAssets } from './fetchPendulumAssets'
import { fetchMoonbeamForeignAssets } from './fetchMoonbeamAssets'
import { supportsRuntimeApi } from './supportsRuntimeApi'
import { fetchUniqueForeignAssets } from './fetchUniqueAssets'
import { fetchPolimecForeignAssets } from './fetchPolimecAssets'
import {
  isRelayChain,
  TJunction,
  TLocation,
  TNodePolkadotKusama,
  TNodeWithRelayChains
} from '@paraspell/sdk-common'
import { getNodeProviders, getParaId, reverseTransformLocation } from '../../sdk-core/src'
import { getRelayChainSymbolOf, isNodeEvm } from './utils'
import { fetchAjunaOtherAssets } from './fetchAjunaAssets'
import { fetchFeeAssets } from './fetchFeeAssets'
import { fetchMantaOtherAssets } from './fetchMantaAssets'
import { fetchHydrationAssets } from './fetchHydrationAssets'
import { fetchPhalaAssets } from './fetchPhalaAssets'
import { fetchAstarAssets } from './fetchAstarAssets'
import { fetchDarwiniaAssets } from './fetchDarwiniaAssets'
import { fetchInterlayAssets } from './fetchInterlayAssets'
import { fetchBasiliskAssets } from './fetchBasiliskAssets'
import { fetchAssetHubAssets } from './fetchAssetHubAssets'
import { fetchAcalaForeignAssets, fetchAcalaNativeAssets } from './fetchAcalaAssets'

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

  if (node === 'Jamton') {
    nativeAssets = await fetchZeitgeistNativeAssets(api, query, 'Native')
  }

  if (node === 'Acala' || node === 'Karura') {
    nativeAssets = await fetchAcalaNativeAssets(node, api, query)
  }

  const transformed = nativeAssets.length > 0 ? nativeAssets : await resolveNativeAssets(node, api)

  const nativeSymbol = getNativeAssetSymbol(node)

  const reordered = transformed.sort((a, b) => {
    if (a.symbol === nativeSymbol) return -1
    if (b.symbol === nativeSymbol) return 1
    return 0
  })

  const paraId = getParaId(node)

  const CUSTOM_NATIVE_JUNCTIONS: Partial<Record<TNodeWithRelayChains, TJunction>> = {
    Nodle: { PalletInstance: 2 },
    Crab: { PalletInstance: 5 },
    Darwinia: { PalletInstance: 5 },
    Zeitgeist: {
      GeneralKey: {
        length: 2,
        data: '0x0001000000000000000000000000000000000000000000000000000000000000'
      }
    },
    Interlay: {
      GeneralKey: {
        length: 2,
        data: '0x0002000000000000000000000000000000000000000000000000000000000000'
      }
    },
    Kintsugi: {
      GeneralKey: {
        length: 2,
        data: '0x000c000000000000000000000000000000000000000000000000000000000000'
      }
    },
    Pendulum: { PalletInstance: 10 },
    NeuroWeb: { PalletInstance: 10 },
    Moonriver: { PalletInstance: 10 },
    Moonbeam: { PalletInstance: 10 },
    Hydration: { GeneralIndex: 0 }
  }

  const getNativeLocation = (symbol: string): TLocation | null => {
    let interior: TLocation['interior'] | null = null

    if (symbol === getRelayChainSymbolOf(node)) {
      interior = { Here: null }
    } else if (symbol === nativeSymbol) {
      const customJunction = CUSTOM_NATIVE_JUNCTIONS[node]

      interior = customJunction
        ? { X2: [{ Parachain: paraId }, customJunction] }
        : { X1: [{ Parachain: paraId }] }
    }

    return interior ? { parents: 1, interior } : null
  }

  const cleanAsset = (asset: TNativeAsset): TNativeAsset => {
    const generatedLoc = getNativeLocation(asset.symbol)

    const location = asset.location ?? (generatedLoc ? capitalizeLocation(generatedLoc) : null)

    return {
      ...asset,
      isNative: true,
      existentialDeposit: asset.existentialDeposit?.replace(/,/g, ''),
      ...(location && { location: transformLocation(location, paraId) })
    }
  }

  return reordered.map(cleanAsset)
}

const fetchOtherAssetsDefault = async (
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

        return {
          assetId: era.toString(),
          symbol: valueHuman.symbol,
          decimals: +valueHuman.decimals,
          existentialDeposit:
            valueHuman.existentialDeposit ??
            valueHuman.minimalBalance ??
            (resDetail?.toHuman() as any)?.existentialDeposit ??
            (resDetail?.toHuman() as any)?.minBalance ??
            (resDetail?.toHuman() as any)?.minimalBalance
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

const fetchOtherAssets = async (
  node: TNodePolkadotKusama,
  api: ApiPromise,
  query: string
): Promise<TForeignAsset[]> => {
  let otherAssets: TForeignAsset[] = []

  if (node.includes('AssetHub')) {
    otherAssets = await fetchAssetHubAssets(api, query)
  }

  if (node.includes('Zeitgeist') || node === 'Jamton') {
    otherAssets = await fetchZeitgeistForeignAssets(
      api,
      query,
      node === 'Jamton' ? 'Native' : undefined
    )
  }

  if (node === 'Acala' || node === 'Karura') {
    otherAssets = await fetchAcalaForeignAssets(api, query)
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
    otherAssets = await fetchCentrifugeAssets(api, query)
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

  if (node.includes('Ajuna') || node.includes('Integritee')) {
    otherAssets = await fetchAjunaOtherAssets(api, query)
  }

  if (node === 'Manta') {
    otherAssets = await fetchMantaOtherAssets(api, query)
  }

  if (node === 'Phala') {
    otherAssets = await fetchPhalaAssets(api, query)
  }

  if (node === 'Astar' || node === 'Shiden') {
    otherAssets = await fetchAstarAssets(api, query)
  }

  if (node === 'Darwinia') {
    otherAssets = await fetchDarwiniaAssets(api, query)
  }

  if (node === 'Interlay' || node === 'Kintsugi') {
    otherAssets = await fetchInterlayAssets(api, query)
  }

  if (node.includes('Hydration')) {
    otherAssets = await fetchHydrationAssets(api, query)
  }

  if (node === 'Basilisk') {
    otherAssets = await fetchBasiliskAssets(api, query)
  }

  return otherAssets.length > 0 ? otherAssets : fetchOtherAssetsDefault(api, query)
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

  const paraId = getParaId(node)

  const supportsXcmPaymentApi = supportsRuntimeApi(api, 'xcmPaymentApi')
  const feeAssets: TLocation[] = supportsXcmPaymentApi ? await fetchFeeAssets(api, paraId) : []

  const nativeAssetSymbol = await resolveNativeAsset(node, api)

  const queryPath = query[0]

  let otherAssets: TForeignAsset[] = []

  if (queryPath) {
    otherAssets = await fetchOtherAssets(node, api, queryPath)
  }

  otherAssets = otherAssets.map(asset => ({
    ...asset,
    existentialDeposit: asset.existentialDeposit?.replace(/,/g, '')
  }))

  otherAssets = otherAssets.map(asset =>
    asset.multiLocation
      ? {
          ...asset,
          multiLocation: transformLocation(asset.multiLocation, paraId)
        }
      : asset
  )

  const nativeAssets = (await fetchNativeAssets(node, api, queryPath)) ?? []

  otherAssets = otherAssets.filter(asset => asset.assetId !== 'Native')

  if (feeAssets.length > 0) {
    const allAssets = [...nativeAssets, ...otherAssets] as unknown as TForeignAsset[]

    feeAssets.forEach(loc => {
      const matched =
        findAssetInfoByLoc(allAssets, loc) ||
        findAssetInfoByLoc(allAssets, reverseTransformLocation(loc))
      if (matched) {
        matched.isFeeAsset = true
      }
    })
  }

  await api.disconnect()

  return {
    nativeAssets,
    otherAssets,
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

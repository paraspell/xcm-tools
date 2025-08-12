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
  type TForeignAssetInfo,
  type TNativeAssetInfo,
  type TChainAssetsInfo
} from '../src'
import { fetchTryMultipleProvidersWithTimeout } from '../../sdk-common/scripts/scriptUtils'
import { chainToQuery } from './chainToQueryMap'
import { fetchEthereumAssets } from './fetchEthereumAssets'
import { addAliasesToDuplicateSymbols } from './addAliases'
import { capitalizeLocation, transformLocation, typedEntries } from './utils'
import { fetchBifrostForeignAssets, fetchBifrostNativeAssets } from './fetchBifrostAssets'
import { fetchCentrifugeAssets, fetchCentrifugeNativeAssets } from './fetchCentrifugeAssets'
import { fetchExistentialDeposit } from './fetchEd'
import { fetchZeitgeistForeignAssets, fetchZeitgeistNativeAssets } from './fetchZeitgeistAssets'
import { fetchComposableAssets } from './fetchComposableAssets'
import { fetchPendulumForeignAssets } from './fetchPendulumAssets'
import { fetchMoonbeamForeignAssets } from './fetchMoonbeamAssets'
import { supportsRuntimeApi } from './supportsRuntimeApi'
import { fetchUniqueForeignAssets } from './fetchUniqueAssets'
import { fetchPolimecForeignAssets } from './fetchPolimecAssets'
import { isRelayChain, TChain, TJunction, TLocation, TSubstrateChain } from '@paraspell/sdk-common'
import { getChainProviders, getParaId, reverseTransformLocation } from '../../sdk-core/src'
import { getRelayChainSymbolOf, isChainEvm } from './utils'
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
import { DEFAULT_SS58_PREFIX } from './consts'

const fetchNativeAssetsDefault = async (api: ApiPromise): Promise<TNativeAssetInfo[]> => {
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
  chain: TSubstrateChain,
  api: ApiPromise
): Promise<TNativeAssetInfo[]> => {
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
  chain: TSubstrateChain,
  api: ApiPromise,
  query: string
): Promise<TNativeAssetInfo[]> => {
  let nativeAssets: TNativeAssetInfo[] = []

  if (chain === 'Curio') {
    nativeAssets = await fetchNativeAssetsCurio(api, query)
  }

  if (chain.includes('Bifrost')) {
    nativeAssets = await fetchBifrostNativeAssets(api, query)
  }

  if (chain === 'Jamton') {
    nativeAssets = await fetchZeitgeistNativeAssets(api, query, 'Native')
  }

  if (chain === 'Acala' || chain === 'Karura') {
    nativeAssets = await fetchAcalaNativeAssets(chain, api, query)
  }

  if (chain === 'Centrifuge') {
    nativeAssets = await fetchCentrifugeNativeAssets(api, query)
  }

  const transformed = nativeAssets.length > 0 ? nativeAssets : await resolveNativeAssets(chain, api)

  const nativeSymbol = getNativeAssetSymbol(chain)

  const reordered = transformed.sort((a, b) => {
    if (a.symbol === nativeSymbol) return -1
    if (b.symbol === nativeSymbol) return 1
    return 0
  })

  const paraId = getParaId(chain)

  const CUSTOM_NATIVE_JUNCTIONS: Partial<Record<TSubstrateChain, TJunction>> = {
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

    if (symbol === getRelayChainSymbolOf(chain)) {
      interior = { Here: null }
    } else if (symbol === nativeSymbol) {
      const customJunction = CUSTOM_NATIVE_JUNCTIONS[chain]

      interior = customJunction
        ? { X2: [{ Parachain: paraId }, customJunction] }
        : { X1: [{ Parachain: paraId }] }
    }

    return interior ? { parents: 1, interior } : null
  }

  const cleanAsset = (asset: TNativeAssetInfo): TNativeAssetInfo => {
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
): Promise<TForeignAssetInfo[]> => {
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

const fetchNativeAssetsCurio = async (
  api: ApiPromise,
  query: string
): Promise<TNativeAssetInfo[]> => {
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

const resolveNativeAsset = async (chain: TSubstrateChain, api: ApiPromise): Promise<string> => {
  // Return hardcoded value for Penpal because query returns null
  if (chain === 'Penpal') return 'UNIT'
  return fetchNativeAsset(api)
}

const fetchOtherAssets = async (
  chain: TSubstrateChain,
  api: ApiPromise,
  query: string
): Promise<TForeignAssetInfo[]> => {
  let otherAssets: TForeignAssetInfo[] = []

  if (chain.includes('AssetHub')) {
    otherAssets = await fetchAssetHubAssets(api, query)
  }

  if (chain.includes('Zeitgeist') || chain === 'Jamton') {
    otherAssets = await fetchZeitgeistForeignAssets(
      api,
      query,
      chain === 'Jamton' ? 'Native' : undefined
    )
  }

  if (chain === 'Acala' || chain === 'Karura') {
    otherAssets = await fetchAcalaForeignAssets(api, query)
  }

  if (chain === 'Amplitude') {
    otherAssets = await fetchOtherAssetsAmplitude(api, query)
  }

  if (chain === 'Curio') {
    otherAssets = await fetchOtherAssetsCurio(api, query)
  }

  if (chain === 'ComposableFinance') {
    otherAssets = await fetchComposableAssets(api, query)
  }

  if (chain.includes('Bifrost')) {
    otherAssets = await fetchBifrostForeignAssets(api, query)
  }

  if (chain === 'Centrifuge' || chain === 'Altair') {
    otherAssets = await fetchCentrifugeAssets(api, query)
  }

  if (chain === 'Pendulum') {
    otherAssets = await fetchPendulumForeignAssets(api, query)
  }

  if (chain === 'Moonbeam' || chain === 'Moonriver') {
    otherAssets = await fetchMoonbeamForeignAssets(api, query, chain)
  }

  if (chain === 'Unique' || chain === 'Quartz') {
    otherAssets = await fetchUniqueForeignAssets(api, query)
  }

  if (chain === 'Polimec' || chain.includes('Kilt') || chain === 'Penpal') {
    otherAssets = await fetchPolimecForeignAssets(api, query)
  }

  if (chain.includes('Ajuna') || chain.includes('Integritee')) {
    otherAssets = await fetchAjunaOtherAssets(api, query)
  }

  if (chain === 'Manta') {
    otherAssets = await fetchMantaOtherAssets(api, query)
  }

  if (chain === 'Phala') {
    otherAssets = await fetchPhalaAssets(api, query)
  }

  if (chain === 'Astar' || chain === 'Shiden') {
    otherAssets = await fetchAstarAssets(api, query)
  }

  if (chain === 'Darwinia') {
    otherAssets = await fetchDarwiniaAssets(api, query)
  }

  if (chain === 'Interlay' || chain === 'Kintsugi') {
    otherAssets = await fetchInterlayAssets(api, query)
  }

  if (chain.includes('Hydration')) {
    otherAssets = await fetchHydrationAssets(api, query)
  }

  if (chain === 'Basilisk') {
    otherAssets = await fetchBasiliskAssets(api, query)
  }

  return otherAssets.length > 0 ? otherAssets : fetchOtherAssetsDefault(api, query)
}

const fetchChainAssets = async (
  chain: TSubstrateChain,
  api: ApiPromise,
  query: string[]
): Promise<Partial<TChainAssetsInfo>> => {
  let ss58Prefix = DEFAULT_SS58_PREFIX
  try {
    ss58Prefix = +api.consts.system.ss58Prefix.toString()
  } catch (e) {
    console.warn(`[${chain}] ss58Prefix unavailable - using default 42`, e)
  }

  const paraId = getParaId(chain)

  const supportsXcmPaymentApi = supportsRuntimeApi(api, 'xcmPaymentApi')
  const feeAssets: TLocation[] = supportsXcmPaymentApi ? await fetchFeeAssets(api, paraId) : []

  const nativeAssetSymbol = await resolveNativeAsset(chain, api)

  const queryPath = query[0]

  let otherAssets: TForeignAssetInfo[] = []

  if (queryPath) {
    otherAssets = await fetchOtherAssets(chain, api, queryPath)
  }

  otherAssets = otherAssets.map(asset => ({
    ...asset,
    existentialDeposit: asset.existentialDeposit?.replace(/,/g, '')
  }))

  otherAssets = otherAssets.map(asset =>
    asset.location
      ? {
          ...asset,
          location: transformLocation(asset.location, paraId)
        }
      : asset
  )

  const nativeAssets = (await fetchNativeAssets(chain, api, queryPath)) ?? []

  otherAssets = otherAssets.filter(asset => asset.assetId !== 'Native')

  if (feeAssets.length > 0) {
    const allAssets = [...nativeAssets, ...otherAssets] as unknown as TForeignAssetInfo[]

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
    isEVM: isChainEvm(api),
    supportsDryRunApi: supportsRuntimeApi(api, 'dryRunApi'),
    supportsXcmPaymentApi
  }
}

export const fetchAllChainsAssets = async (assetsMapJson: any) => {
  const output: TAssetJsonMap = JSON.parse(JSON.stringify(assetsMapJson))

  console.log(`Fetching assets for Ethereum...`)
  const ethereumData = await fetchEthereumAssets()
  output['Ethereum'] = ethereumData

  for (const [chain, query] of typedEntries(chainToQuery)) {
    console.log(`Fetching assets for ${chain}...`)

    let newData

    newData = await fetchTryMultipleProvidersWithTimeout(chain, getChainProviders, api =>
      fetchChainAssets(chain, api, query)
    )

    const isError = newData === null
    const oldData = output[chain] ?? null

    if (isError && oldData) {
      // If fetching new data fails, keep existing data
      output[chain] = oldData
    } else {
      // Append manually added assets from oldData to newData
      const manuallyAddedNativeAssets =
        oldData?.nativeAssets?.filter(asset => asset.manuallyAdded) ?? []
      const manuallyAddedOtherAssets =
        oldData?.otherAssets?.filter(asset => asset.manuallyAdded) ?? []

      const combinedNativeAssets = [...(newData?.nativeAssets ?? []), ...manuallyAddedNativeAssets]
      const combinedOtherAssets = [...(newData?.otherAssets ?? []), ...manuallyAddedOtherAssets]

      output[chain] = {
        relaychainSymbol: getRelayChainSymbolOf(chain),
        nativeAssetSymbol: newData?.nativeAssetSymbol ?? '',
        isEVM: newData?.isEVM ?? false,
        ss58Prefix: newData?.ss58Prefix ?? DEFAULT_SS58_PREFIX,
        supportsDryRunApi: newData?.supportsDryRunApi ?? false,
        supportsXcmPaymentApi: newData?.supportsXcmPaymentApi ?? false,
        nativeAssets: combinedNativeAssets,
        otherAssets: isRelayChain(chain) ? [] : combinedOtherAssets
      }
    }
  }

  return addAliasesToDuplicateSymbols(output)
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  DEFAULT_SS58_PREFIX,
  isSubstrateChain,
  type TJunction,
  type TLocation,
  type TSubstrateChain
} from '@paraspell/sdk-common'
import type { PolkadotClient } from 'polkadot-api'

import { getParaId, getRelayChainSymbolOf, reverseTransformLocation } from '../../sdk-core/src'
import {
  findAssetInfoByLoc,
  normalizeLocation,
  type TAssetInfo,
  type TAssetJsonMap,
  type TChainAssetsInfo
} from '../src'
import { addAliasesToDuplicateSymbols } from './addAliases'
import { chainToQuery } from './chainToQueryMap'
import type { TAssetInfoNoLoc } from './types'
import {
  fetchFeeAssets,
  fetchNativeAssetsDefault,
  fetchNativeAssetSymbol,
  fetchOtherAssetsDefault,
  transformLocation,
  typedEntries
} from './utils'
import {
  CHAIN_TIMEOUT_MS,
  fetchFromChain,
  filterRequestedChains,
  getChainMetadataFlags,
  handleDataFetching
} from '../../sdk-common/scripts/scriptUtils'
import { createScriptProgress } from '../../sdk-common/scripts/progress'
import { getNativeAssetsFetcher, getOtherAssetsFetcher } from './fetchers'
import { fetchInterlayNativeAssets, fetchKintsugiNativeAssets } from './fetchers/interlay'

const JSON_FILE_PATH = './src/maps/assets.json'

const resolveNativeAssetSymbol = async (
  chain: TSubstrateChain,
  client: PolkadotClient
): Promise<string> => (chain === 'Penpal' ? 'UNIT' : fetchNativeAssetSymbol(client))

const resolveNativeAssets = async (
  chain: TSubstrateChain,
  client: PolkadotClient
): Promise<TAssetInfoNoLoc[]> => {
  if (chain === 'Penpal') {
    return [
      {
        symbol: await resolveNativeAssetSymbol(chain, client),
        isNative: true,
        decimals: 12,
        existentialDeposit: '1'
      }
    ]
  }
  const defaultNativeAssets = await fetchNativeAssetsDefault(client)
  if (chain === 'BifrostPaseo') return defaultNativeAssets.slice(0, 1)
  if (chain === 'Hydration') return defaultNativeAssets.map(asset => ({ ...asset, assetId: '0' }))
  return defaultNativeAssets
}

const fetchNativeAssets = async (
  chain: TSubstrateChain,
  client: PolkadotClient,
  nativeSymbol: string
): Promise<TAssetInfoNoLoc[]> => {
  const fetcher = getNativeAssetsFetcher(chain)
  let nativeAssets: TAssetInfoNoLoc[] = fetcher ? await fetcher(client, chain) : []

  const defaultNativeAssets = await resolveNativeAssets(chain, client)

  if (chain === 'Interlay') nativeAssets = fetchInterlayNativeAssets(defaultNativeAssets)
  if (chain === 'Kintsugi') nativeAssets = fetchKintsugiNativeAssets(defaultNativeAssets)

  const transformed = nativeAssets.length > 0 ? nativeAssets : defaultNativeAssets

  const reordered = transformed.sort((a, b) => {
    if (a.symbol === nativeSymbol) return -1
    if (b.symbol === nativeSymbol) return 1
    return 0
  })

  const paraId = getParaId(chain)

  const CUSTOM_NATIVE_JUNCTIONS: Partial<Record<TSubstrateChain, TJunction>> = {
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
    Ajuna: {
      GeneralKey: {
        length: 4,
        data: '0x414a554e00000000000000000000000000000000000000000000000000000000'
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

  const cleanAsset = (asset: TAssetInfoNoLoc): TAssetInfoNoLoc => {
    const generatedLoc = getNativeLocation(asset.symbol)
    const location = asset.location ?? (generatedLoc ? normalizeLocation(generatedLoc) : null)
    return {
      ...asset,
      isNative: true,
      ...(location && { location: transformLocation(location, paraId) })
    }
  }

  return reordered.map(cleanAsset)
}

const fetchOtherAssets = (
  chain: TSubstrateChain,
  client: PolkadotClient,
  query: string
): Promise<TAssetInfoNoLoc[]> => {
  const fetcher = getOtherAssetsFetcher(chain)
  return fetcher ? fetcher(client, chain) : fetchOtherAssetsDefault(client, query)
}

export const fetchChainAssets = async (
  chain: TSubstrateChain,
  client: PolkadotClient,
  query: string
): Promise<Partial<TChainAssetsInfo>> => {
  let ss58Prefix = DEFAULT_SS58_PREFIX
  try {
    ss58Prefix = Number(await client.getUnsafeApi().constants.System.SS58Prefix())
  } catch {
    // keep default
  }

  const paraId = getParaId(chain)
  const { supportsDryRunApi, supportsXcmPaymentApi, isEVM } = await getChainMetadataFlags(client)
  const feeAssets: TLocation[] = supportsXcmPaymentApi ? await fetchFeeAssets(client, paraId) : []

  const nativeAssetSymbol = await resolveNativeAssetSymbol(chain, client)

  let otherAssets = query ? await fetchOtherAssets(chain, client, query) : []
  otherAssets = otherAssets
    .map(asset =>
      asset.location ? { ...asset, location: transformLocation(asset.location, paraId) } : asset
    )
    .filter(asset => asset.assetId !== 'Native')

  const nativeAssets = (await fetchNativeAssets(chain, client, nativeAssetSymbol)) ?? []

  const joinedAssets = [...nativeAssets, ...otherAssets].filter(
    (asset): asset is TAssetInfo => asset.location !== undefined
  )

  if (feeAssets.length > 0) {
    feeAssets.forEach(loc => {
      const matched =
        findAssetInfoByLoc(joinedAssets, loc) ||
        findAssetInfoByLoc(joinedAssets, reverseTransformLocation(loc))
      if (matched) matched.isFeeAsset = true
    })
  }

  return {
    assets: joinedAssets,
    nativeAssetSymbol,
    ss58Prefix,
    isEVM,
    supportsDryRunApi,
    supportsXcmPaymentApi
  }
}

const fetchAllChainsAssets = async (assetsMapJson: any) => {
  const output: TAssetJsonMap = JSON.parse(JSON.stringify(assetsMapJson))

  const entries = filterRequestedChains(typedEntries(chainToQuery), ([chain]) => chain)

  const progress = createScriptProgress(
    entries.map(([chain]) => chain),
    'Assets',
    CHAIN_TIMEOUT_MS
  )

  for (const [chain, query] of entries) {
    progress.update(chain)

    if (typeof query === 'function') {
      output[chain] = await query()
      continue
    }

    if (!isSubstrateChain(chain)) continue

    const newData = await fetchFromChain(chain, client => fetchChainAssets(chain, client, query))
    const oldData = output[chain] ?? null

    if (newData === null && oldData) {
      output[chain] = oldData
    } else {
      output[chain] = {
        relaychainSymbol: getRelayChainSymbolOf(chain),
        nativeAssetSymbol: newData?.nativeAssetSymbol ?? '',
        isEVM: newData?.isEVM ?? false,
        ss58Prefix: newData?.ss58Prefix ?? DEFAULT_SS58_PREFIX,
        supportsDryRunApi: newData?.supportsDryRunApi ?? false,
        supportsXcmPaymentApi: newData?.supportsXcmPaymentApi ?? false,
        assets: newData?.assets ?? []
      }
    }
  }

  progress.stop()

  return addAliasesToDuplicateSymbols(output)
}

void (async () => {
  await handleDataFetching(JSON_FILE_PATH, fetchAllChainsAssets, 'Successfuly updated assets map.')
})()

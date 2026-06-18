/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TLocation } from '@paraspell/sdk-common'
import type { PolkadotClient, TypedApi } from 'polkadot-api'

import { decodeSymbol, normalizeLocation } from './codecUtils'
import type { TAssetInfoNoLoc } from '../types'
import { transformLocation } from './transformLocation'

export const isLive = (details: any) => (details?.status?.type ?? details?.status) === 'Live'

export const edString = (v: any): string =>
  String(v.minimal_balance ?? v.existential_deposit ?? v.min_balance)

const fetchEd = async (client: PolkadotClient): Promise<string | null> => {
  try {
    return String(await client.getUnsafeApi().constants.Balances.ExistentialDeposit())
  } catch {
    return null
  }
}

export const fetchFeeAssets = async (
  client: PolkadotClient,
  paraId: number
): Promise<TLocation[]> => {
  const result: any = await client
    .getUnsafeApi()
    .apis.XcmPaymentApi.query_acceptable_payment_assets(4)
  if (!result?.success) throw new Error('Failed to fetch fee assets')
  return result.value
    .map((asset: any) => normalizeLocation(asset))
    .filter((loc: TLocation | undefined): loc is TLocation => loc !== undefined)
    .map((loc: TLocation) => transformLocation(loc, paraId))
}

export const fetchNativeAssetSymbol = async (client: PolkadotClient): Promise<string> => {
  const { properties } = await client.getChainSpecData()
  return ([properties?.tokenSymbol].flat() as string[])[0]
}

export const fetchNativeAssetsDefault = async (
  client: PolkadotClient
): Promise<TAssetInfoNoLoc[]> => {
  const { properties } = await client.getChainSpecData()
  const symbols = [properties?.tokenSymbol].flat() as string[]
  const decimals = [properties?.tokenDecimals].flat() as number[]
  const ed = await fetchEd(client)
  return symbols.map((symbol, i) => ({
    symbol,
    isNative: true,
    decimals: decimals[i] ?? decimals[0],
    existentialDeposit: ed ?? '0'
  }))
}

export const fetchOtherAssetsDefault = async (
  client: PolkadotClient,
  query: string
): Promise<TAssetInfoNoLoc[]> => {
  const [pallet, storage] = query.split('.')
  const api = client.getUnsafeApi()
  const entries = await api.query[pallet][storage].getEntries()

  const results = await Promise.all(
    entries.map(async ({ keyArgs: [era], value }: any) => {
      const detail: any =
        api.query[pallet].Asset !== undefined
          ? await api.query[pallet].Asset.getValue(era)
          : undefined
      const symbol = decodeSymbol(value.symbol)
      return {
        assetId: String(era),
        symbol,
        decimals: value.decimals,
        location: symbol === 'DOT' ? { parents: 1, interior: { Here: null } } : undefined,
        existentialDeposit: String(
          value.existential_deposit ??
            value.minimal_balance ??
            detail?.existential_deposit ??
            detail?.min_balance ??
            detail?.minimal_balance
        )
      }
    })
  )

  return results.filter(asset => asset.symbol)
}

export const fetchAssetsPalletAssets = async (
  client: PolkadotClient,
  resolveLocation: (
    id: unknown,
    symbol: string,
    api: TypedApi<any, false>
  ) => Promise<TLocation | undefined> | TLocation | undefined
): Promise<TAssetInfoNoLoc[]> => {
  const api = client.getUnsafeApi()
  const entries = await api.query.Assets.Metadata.getEntries()

  const assets = await Promise.all(
    entries.map(async ({ keyArgs: [id], value }: { keyArgs: unknown[]; value: any }) => {
      const details = await api.query.Assets.Asset.getValue(id)
      if (!isLive(details)) return null

      const symbol = decodeSymbol(value.symbol)
      return {
        assetId: String(id),
        symbol,
        decimals: value.decimals,
        existentialDeposit: edString(details),
        location: await resolveLocation(id, symbol, api)
      }
    })
  )

  return assets.filter((a): a is NonNullable<typeof a> => a !== null)
}

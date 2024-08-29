/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ApiPromise } from '@polkadot/api'
import {
  TAssetDetails,
  TAssetJsonMap,
  TNativeAssetDetails,
  TNodeAssets,
  TNodePolkadotKusama
} from '../../src/types'
import { getNode, getNodeEndpointOption } from '../../src/utils'
import { fetchTryMultipleProvidersWithTimeout } from '../scriptUtils'
import { nodeToQuery } from './nodeToQueryMap'

const fetchNativeAssets = async (api: ApiPromise): Promise<TNativeAssetDetails[]> => {
  const propertiesRes = await api.rpc.system.properties()
  const json = propertiesRes.toHuman()
  const symbols = json.tokenSymbol as string[]
  const decimals = json.tokenDecimals as string[]
  return symbols.map((symbol, i) => ({
    symbol,
    decimals: decimals[i] ? +decimals[i] : +decimals[0]
  }))
}

const fetchBifrostNativeAssets = async (api: ApiPromise): Promise<TNativeAssetDetails[]> => {
  const res = await api.rpc.state.getMetadata()
  const DEFAULT_DECIMALS = -1
  // Decimals for Bifrost Polkadot will be set to -1 and later derived from other assets
  const typeId = res.asLatest.lookup.types.find(obj => {
    return obj.type.path
      .toArray()
      .map(el => el.toHuman().toString())
      .includes('TokenSymbol')
  })

  return typeId!.type.def.asVariant.variants.map(k => ({
    symbol: k.name.toHuman(),
    decimals: DEFAULT_DECIMALS
  }))
}

const fetchOtherAssets = async (api: ApiPromise, query: string) => {
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

const fetchAssetIdsOnly = async (api: ApiPromise, query: string) => {
  const [module, section] = query.split('.')
  const res = await api.query[module][section].entries()
  return res.map(
    ([
      {
        args: [era]
      }
    ]) => ({
      assetId: era.toString()
    })
  )
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

const fetchOtherAssetsCentrifuge = async (api: ApiPromise, query: string) => {
  const [module, section] = query.split('.')
  const res = await api.query[module][section].entries()
  return res
    .filter(
      ([
        {
          args: [era]
        }
      ]) => era.toHuman() !== 'Native'
    )
    .map(
      ([
        {
          args: [era]
        },
        value
      ]) => {
        const { symbol, decimals } = value.toHuman() as any
        const eraObj = era as any
        return {
          assetId:
            eraObj.type === 'Tranche'
              ? Object.values(era.toHuman() ?? {})[0][0].replaceAll(',', '')
              : Object.values(era.toHuman() ?? {})[0].replaceAll(',', ''),
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
    .filter(asset => asset !== null) as unknown as TAssetDetails[]
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

const removePrefix = (inputString: string, prefix: string) => {
  if (inputString.startsWith(prefix)) {
    return inputString.substring(prefix.length)
  }
  return inputString
}

const transformOtherAssets = (otherAssets: any, node: TNodePolkadotKusama) => {
  return node === 'Moonbeam' || node === 'Moonriver'
    ? otherAssets.map((asset: any) => ({ ...asset, symbol: removePrefix(asset.symbol, 'xc') }))
    : otherAssets
}

const fetchNativeAsset = async (api: ApiPromise): Promise<string> => {
  const propertiesRes = await api.rpc.system.properties()
  const json = propertiesRes.toHuman()
  const symbols = json.tokenSymbol as string[]
  return symbols[0]
}

const fetchNodeAssets = async (
  node: TNodePolkadotKusama,
  api: ApiPromise,
  query: string | null
): Promise<Partial<TNodeAssets>> => {
  const nativeAssetSymbol = await fetchNativeAsset(api)

  // Different format of data
  if (node === 'Acala' || node === 'Karura') {
    const assets = await fetchAssetsType2(api, query!)
    await api.disconnect()
    return { ...assets, nativeAssetSymbol }
  }

  if (node === 'Polkadex') {
    const nativeAssets = (await fetchNativeAssets(api)) ?? []
    const otherAssets = await fetchAssetIdsOnly(api, query!)
    await api.disconnect()
    return {
      nativeAssets,
      otherAssets,
      nativeAssetSymbol
    }
  }

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

  if (node === 'Pioneer') {
    const { otherAssets } = await fetchAssetsType2(api, query!)
    const nativeAssets = (await fetchNativeAssets(api)) ?? []
    await api.disconnect()
    return {
      nativeAssets,
      otherAssets,
      nativeAssetSymbol
    }
  }

  // Different format of data
  if (node === 'Centrifuge' || node === 'Altair') {
    const nativeAssets = (await fetchNativeAssets(api)) ?? []
    const otherAssets = query ? await fetchOtherAssetsCentrifuge(api, query) : []
    await api.disconnect()
    return {
      nativeAssets,
      otherAssets,
      nativeAssetSymbol
    }
  }

  // Different format of data
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

  if (node === 'BifrostPolkadot') {
    const nativeAssets = (await fetchBifrostNativeAssets(api)) ?? []
    await api.disconnect()
    return {
      nativeAssets,
      otherAssets: [],
      nativeAssetSymbol
    }
  }

  const nativeAssets = (await fetchNativeAssets(api)) ?? []

  const otherAssets = query ? await fetchOtherAssets(api, query) : []

  await api.disconnect()

  return {
    nativeAssets,
    otherAssets: transformOtherAssets(otherAssets, node),
    nativeAssetSymbol
  }
}

export const fetchAllNodesAssets = async (assetsMapJson: any) => {
  const output: TAssetJsonMap = JSON.parse(JSON.stringify(assetsMapJson))
  for (const [node, query] of Object.entries(nodeToQuery)) {
    const nodeName = node as TNodePolkadotKusama
    console.log(`Fetching assets for ${nodeName}...`)

    const newData = await fetchTryMultipleProvidersWithTimeout(nodeName, api =>
      fetchNodeAssets(nodeName, api, query)
    )

    const isError = newData === null
    const oldData = Object.prototype.hasOwnProperty.call(output, nodeName) ? output[nodeName] : null

    const paraId = getNodeEndpointOption(nodeName)?.paraId
    if (!paraId) {
      throw new Error(`Cannot find paraId for node ${nodeName}`)
    }

    // In case we cannot fetch assets for some node. Keep existing data
    output[nodeName] = {
      paraId,
      relayChainAssetSymbol: getNode(nodeName).type === 'polkadot' ? 'DOT' : 'KSM',
      nativeAssetSymbol:
        isError && oldData ? oldData.nativeAssetSymbol : (newData?.nativeAssetSymbol ?? ''),
      nativeAssets: isError && oldData ? oldData.nativeAssets : (newData?.nativeAssets ?? []),
      otherAssets: isError && oldData ? oldData.otherAssets : (newData?.otherAssets ?? [])
    }
  }
  return output
}

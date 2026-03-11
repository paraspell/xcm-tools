import type { ApiPromise } from '@polkadot/api'
import { capitalizeLocation } from './utils'
import { TLocation } from '@paraspell/sdk-common'
import { TAssetInfoNoLoc } from './types'

export const fetchInterlayAssets = async (
  api: ApiPromise,
  query: string
): Promise<TAssetInfoNoLoc[]> => {
  const [module, method] = query.split('.')
  const assets = await api.query[module][method].entries()

  return assets.map(
    ([
      {
        args: [era]
      },
      value
    ]) => {
      const { symbol, decimals, existentialDeposit } = value.toHuman() as any

      const locationJson = value.toJSON() as any

      const location =
        locationJson.location !== null
          ? capitalizeLocation(locationJson.location.v3 ?? locationJson.location.v2)
          : undefined

      return {
        assetId: Object.values(era.toHuman() ?? {})[0],
        symbol,
        decimals: +decimals,
        location,
        existentialDeposit: existentialDeposit
      }
    }
  )
}

export const fetchInterlayNativeAssets = async (
  nativeAssets: TAssetInfoNoLoc[]
): Promise<TAssetInfoNoLoc[]> => {
  const CUSTOM_NATIVE_JUNCTIONS: Record<string, TLocation> = {
    IBTC: {
      parents: 1,
      interior: {
        X2: [
          {
            Parachain: 2032
          },
          {
            GeneralKey: {
              length: 2,
              data: '0x0001000000000000000000000000000000000000000000000000000000000000'
            }
          }
        ]
      }
    },
    KINT: {
      parents: 1,
      interior: {
        X2: [
          {
            Parachain: 2092
          },
          {
            GeneralKey: {
              length: 2,
              data: '0x000c000000000000000000000000000000000000000000000000000000000000'
            }
          }
        ]
      }
    },
    KBTC: {
      parents: 1,
      interior: {
        X2: [
          {
            Parachain: 2092
          },
          {
            GeneralKey: {
              length: 2,
              data: '0x000b000000000000000000000000000000000000000000000000000000000000'
            }
          }
        ]
      }
    },
    KSM: {
      parents: 2,
      interior: {
        X1: [
          {
            GlobalConsensus: {
              kusama: null
            }
          }
        ]
      }
    }
  }

  return nativeAssets.map(asset => {
    const customLoc = CUSTOM_NATIVE_JUNCTIONS[asset.symbol]
    return {
      ...asset,
      location: customLoc
    }
  })
}

export const fetchKintsugiNativeAssets = async (
  nativeAssets: TAssetInfoNoLoc[]
): Promise<TAssetInfoNoLoc[]> => {
  const CUSTOM_NATIVE_JUNCTIONS: Record<string, TLocation> = {
    KBTC: {
      parents: 1,
      interior: {
        X2: [
          {
            Parachain: 2092
          },
          {
            GeneralKey: {
              length: 2,
              data: '0x000b000000000000000000000000000000000000000000000000000000000000'
            }
          }
        ]
      }
    }
  }

  return nativeAssets.map(asset => {
    const customLoc = CUSTOM_NATIVE_JUNCTIONS[asset.symbol]
    return {
      ...asset,
      location: customLoc
    }
  })
}

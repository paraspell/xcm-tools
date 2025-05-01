/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { ApiPromise } from '@polkadot/api'
import { findAssetByMultiLocation, getOtherAssets, type TForeignAsset } from '../src'
import { capitalizeMultiLocation } from './fetchOtherAssetsRegistry'

export const fetchMoonbeamForeignAssets = async (
  api: ApiPromise,
  query: string
): Promise<TForeignAsset[]> => {
  const [module, section] = query.split('.')
  const assetsEntries = await api.query[module][section].entries()

  const assets: TForeignAsset[] = await Promise.all(
    assetsEntries.map(
      async ([
        {
          args: [era]
        },
        value
      ]) => {
        const { xcm } = value.toJSON() as any
        const assetId = era.toHuman() as string
        const numberAssetId = assetId.replace(/[,]/g, '')

        const metadata = await api.query.assets.metadata(era)
        const { symbol, decimals } = metadata.toHuman() as any
        const details = await api.query.assets.asset(era)
        const { minBalance } = details.toHuman() as any

        return {
          assetId: numberAssetId,
          symbol,
          decimals: +decimals,
          multiLocation: capitalizeMultiLocation(xcm),
          existentialDeposit: minBalance
        }
      }
    )
  )

  const evmEntries = await api.query.evmForeignAssets.assetsById.entries()

  const evmAssets: TForeignAsset[] = evmEntries.flatMap(
    ([
      {
        args: [era]
      },
      value
    ]) => {
      const assetId = era.toHuman() as string
      const numberAssetId = assetId.replace(/[,]/g, '')
      const multiLocation = capitalizeMultiLocation(value.toJSON() as any)

      const ethAssets = getOtherAssets('Ethereum')
      const asset = findAssetByMultiLocation(ethAssets, multiLocation)

      if (!asset) {
        return []
      }

      const hydrationAssets = getOtherAssets('Hydration')
      const hydrationAsset = findAssetByMultiLocation(hydrationAssets, multiLocation)

      let decimals: number | undefined

      // Hardcode DAI decimals to 18 because it is not available in the registry
      if (asset.symbol === 'DAI') {
        decimals = 18
      } else {
        if (!hydrationAsset) {
          throw new Error(
            `Hydration asset not found for Moonbeam asset multiLocation: ${JSON.stringify(multiLocation)}`
          )
        }
        decimals = hydrationAsset.decimals
      }

      return [
        {
          symbol: asset.symbol,
          existentialDeposit: asset.existentialDeposit,
          decimals,
          assetId: numberAssetId,
          multiLocation
        }
      ]
    }
  )

  return [...assets, ...evmAssets]
}

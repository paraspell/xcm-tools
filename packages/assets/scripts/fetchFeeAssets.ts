import { TLocation } from '@paraspell/sdk-common'
import { ApiPromise } from '@polkadot/api'
import { capitalizeLocation, transformLocation } from './utils'

export const fetchFeeAssets = async (api: ApiPromise, paraId: number): Promise<TLocation[]> => {
  const xcmVersion = 4
  const result = await api.call.xcmPaymentApi.queryAcceptablePaymentAssets(xcmVersion)

  const resultJson = result.toJSON() as any

  if (resultJson.ok === undefined) {
    throw new Error('Failed to fetch fee assets')
  }

  const assets = resultJson.ok.map((asset: any) =>
    capitalizeLocation(asset[`v${xcmVersion}`])
  ) as TLocation[]

  return assets.map(loc => transformLocation(loc, paraId))
}

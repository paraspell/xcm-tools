import { TMultiLocation } from '@paraspell/sdk-common'
import { ApiPromise } from '@polkadot/api'
import { capitalizeMultiLocation, transformLocation } from './utils'

export const fetchFeeAssets = async (
  api: ApiPromise,
  paraId: number
): Promise<TMultiLocation[]> => {
  const xcmVersion = 4
  const result = await api.call.xcmPaymentApi.queryAcceptablePaymentAssets(xcmVersion)

  const resultJson = result.toJSON() as any

  if (resultJson.ok === undefined) {
    throw new Error('Failed to fetch fee assets')
  }

  const assets = resultJson.ok.map((asset: any) =>
    capitalizeMultiLocation(asset[`v${xcmVersion}`])
  ) as TMultiLocation[]

  return assets.map(loc => transformLocation(loc, paraId))
}

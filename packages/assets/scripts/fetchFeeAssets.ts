import { TMultiLocation } from '@paraspell/sdk-common'
import { ApiPromise } from '@polkadot/api'
import { capitalizeMultiLocation } from './fetchOtherAssetsRegistry'

export const fetchFeeAssets = async (api: ApiPromise): Promise<TMultiLocation[]> => {
  const xcmVersion = 4
  const result = await api.call.xcmPaymentApi.queryAcceptablePaymentAssets(xcmVersion)

  const resultJson = result.toJSON() as any

  if (resultJson.ok === undefined) {
    throw new Error('Failed to fetch fee assets')
  }

  return resultJson.ok.map((asset: any) =>
    capitalizeMultiLocation(asset[`v${xcmVersion}`])
  ) as TMultiLocation[]
}

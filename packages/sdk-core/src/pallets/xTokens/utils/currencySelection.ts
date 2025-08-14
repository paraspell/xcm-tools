import type { TAsset } from '@paraspell/assets'

import type { TXcmVersioned, TXTokensTransferOptions } from '../../../types'
import { addXcmVersionHeader } from '../../../utils'
import { createAsset, maybeOverrideAssets } from '../../../utils/asset'
import { buildLocation } from './locationResolvers'

export const createDefaultCurrencySelection = <TApi, TRes>(
  input: TXTokensTransferOptions<TApi, TRes>
) => {
  const { asset, version } = input
  const location = buildLocation(input)
  const multiAsset = createAsset(version, asset.amount, location)
  return addXcmVersionHeader(multiAsset, version)
}

export const getModifiedCurrencySelection = <TApi, TRes>(
  input: TXTokensTransferOptions<TApi, TRes>
): TXcmVersioned<TAsset | TAsset[]> => {
  const { version, asset, overriddenAsset } = input

  if (overriddenAsset) {
    return addXcmVersionHeader(
      maybeOverrideAssets(version, asset.amount, [], overriddenAsset),
      version
    )
  }

  return createDefaultCurrencySelection(input)
}

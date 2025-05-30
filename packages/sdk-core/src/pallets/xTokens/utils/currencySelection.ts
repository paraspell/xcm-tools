import type { TMultiAsset } from '@paraspell/assets'

import type { TXcmVersioned, TXTokensTransferOptions } from '../../../types'
import {
  addXcmVersionHeader,
  createMultiAsset,
  maybeOverrideMultiAssets
} from '../../xcmPallet/utils'
import { buildMultiLocation } from './multiLocationResolvers'

export const createDefaultCurrencySelection = <TApi, TRes>(
  input: TXTokensTransferOptions<TApi, TRes>
) => {
  const { asset, version } = input
  const multiLocation = buildMultiLocation(input)
  const multiAsset = createMultiAsset(version, asset.amount, multiLocation)
  return addXcmVersionHeader(multiAsset, version)
}

export const getModifiedCurrencySelection = <TApi, TRes>(
  input: TXTokensTransferOptions<TApi, TRes>
): TXcmVersioned<TMultiAsset | TMultiAsset[]> => {
  const { version, asset, overriddenAsset } = input

  if (overriddenAsset) {
    return addXcmVersionHeader(
      maybeOverrideMultiAssets(version, asset.amount, [], overriddenAsset),
      version
    )
  }

  return createDefaultCurrencySelection(input)
}

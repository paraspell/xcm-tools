// Contains basic structure of xTokens call

import { DEFAULT_FEE } from '../../constants'
import type { TXTokensCurrencySelection, TXTokensTransferOptions } from '../../types'
import { assertToIsString } from '../../utils'
import { ERR_LOCATION_DEST_NOT_SUPPORTED } from './consts'
import { buildXTokensCall } from './utils'

export const transferXTokens = <TApi, TRes>(
  input: TXTokensTransferOptions<TApi, TRes>,
  currencySelection: TXTokensCurrencySelection,
  fees: string | number = DEFAULT_FEE
): TRes => {
  const { api, destination } = input

  assertToIsString(destination, ERR_LOCATION_DEST_NOT_SUPPORTED)
  const call = buildXTokensCall(input, currencySelection, fees)
  return api.deserializeExtrinsics(call)
}

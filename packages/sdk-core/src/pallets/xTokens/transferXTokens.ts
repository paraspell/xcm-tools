// Contains basic structure of xTokens call

import { DEFAULT_FEE } from '../../constants'
import { InvalidParameterError } from '../../errors'
import type { TDestination, TXTokensCurrencySelection, TXTokensTransferOptions } from '../../types'
import { buildXTokensCall } from './utils'

const ERR_MULTILOCATION_DEST_NOT_SUPPORTED =
  'Multilocation destinations are not supported for specific transfer you are trying to create. In special cases such as xTokens or xTransfer pallet try using address multilocation instead (for both destination and address in same multilocation set (eg. X2 - Parachain, Address). For further assistance please open issue in our repository.'

export const validateDestination = (destination: TDestination) => {
  const isMultiLocationDestination = typeof destination === 'object'
  if (isMultiLocationDestination) {
    throw new InvalidParameterError(ERR_MULTILOCATION_DEST_NOT_SUPPORTED)
  }
}

export const transferXTokens = <TApi, TRes>(
  input: TXTokensTransferOptions<TApi, TRes>,
  currencySelection: TXTokensCurrencySelection,
  fees: string | number = DEFAULT_FEE
): TRes => {
  const { api, destination } = input

  validateDestination(destination)
  const call = buildXTokensCall(input, currencySelection, fees)
  return api.callTxMethod(call)
}

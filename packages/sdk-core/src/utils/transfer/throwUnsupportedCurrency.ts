import { InvalidCurrencyError, type TCurrencyInput } from '@paraspell/assets'
import { replaceBigInt } from '@paraspell/sdk-common'

export const throwUnsupportedCurrency = (
  currency: TCurrencyInput,
  chain: string,
  { isDestination } = { isDestination: false }
): never => {
  if ('location' in currency) {
    throw new InvalidCurrencyError(`
      Selected chain doesn't support location you provided. If you meant a custom location, register it with the 'customAssets' Builder option instead.`)
  }

  throw new InvalidCurrencyError(
    `${isDestination ? 'Destination' : 'Origin'} chain ${chain} does not support currency ${JSON.stringify(currency, replaceBigInt)}.`
  )
}

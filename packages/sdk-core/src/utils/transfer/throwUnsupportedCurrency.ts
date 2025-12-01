import { InvalidCurrencyError, type TCurrencyInput } from '@paraspell/assets'
import { replaceBigInt } from '@paraspell/sdk-common'

export const throwUnsupportedCurrency = (
  currency: TCurrencyInput,
  chain: string,
  { isDestination } = { isDestination: false }
): never => {
  if ('location' in currency) {
    throw new InvalidCurrencyError(`
      Selected chain doesn't support location you provided. Maybe you meant custom location. If so, you need to use override option. Your selection should look like this: {location: Override(${JSON.stringify(currency.location)})}.`)
  }

  throw new InvalidCurrencyError(
    `${isDestination ? 'Destination' : 'Origin'} chain ${chain} does not support currency ${JSON.stringify(currency, replaceBigInt)}.`
  )
}

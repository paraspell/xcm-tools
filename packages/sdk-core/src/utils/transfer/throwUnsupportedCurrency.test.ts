import { InvalidCurrencyError, type TCurrencyInput } from '@paraspell/assets'
import { describe, expect, it } from 'vitest'

import { throwUnsupportedCurrency } from './throwUnsupportedCurrency'

describe('throwUnsupportedCurrency', () => {
  const originChain = 'Acala'

  it('suggests using the override option when a location is supplied', () => {
    const currency = { location: { parents: 1, interior: 'Here' } } as TCurrencyInput
    const act = () => throwUnsupportedCurrency(currency, originChain)

    expect(act).toThrow(InvalidCurrencyError)
    expect(act).toThrow("Selected chain doesn't support location you provided.")
    expect(act).toThrow('Override')
  })

  it('serializes the unsupported origin currency when no location is given', () => {
    const currency = { symbol: 'DOT', amount: 10n } as TCurrencyInput
    const act = () => throwUnsupportedCurrency(currency, originChain)

    expect(act).toThrow(
      'Origin chain Acala does not support currency {"symbol":"DOT","amount":"10"}.'
    )
  })

  it('marks the chain as destination when requested', () => {
    const currency = { symbol: 'GLMR' } as TCurrencyInput
    const destinationChain = 'Moonbeam'

    const act = () => throwUnsupportedCurrency(currency, destinationChain, { isDestination: true })

    expect(act).toThrow('Destination chain Moonbeam does not support currency {"symbol":"GLMR"}.')
  })
})

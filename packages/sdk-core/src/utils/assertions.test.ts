import { describe, expect, it } from 'vitest'

import { InvalidAddressError, MissingParameterError, UnsupportedOperationError } from '../errors'
import { assertSender, assertSenderSource, assertSwapSupport } from './assertions'

describe('assertions', () => {
  describe('assertSender', () => {
    it('should throw if address is undefined', () => {
      expect(() => assertSender(undefined)).toThrow(MissingParameterError)
    })
    it('should not throw if address is a string', () => {
      expect(() => assertSender('some-address')).not.toThrow()
    })
  })

  describe('assertDerivationPath', () => {
    it('should throw if path is undefined', () => {
      expect(() => assertSenderSource(undefined)).toThrow(InvalidAddressError)
    })
  })

  describe('assertSwapSupport', () => {
    it('throws UnsupportedOperationError when swapOptions are provided', () => {
      const swapOptions = { currencyTo: { symbol: 'GLMR' }, exchange: undefined, slippage: 1 }
      expect(() => assertSwapSupport(swapOptions)).toThrow(UnsupportedOperationError)
    })

    it('does not throw when swapOptions is undefined', () => {
      expect(() => assertSwapSupport(undefined)).not.toThrow()
    })
  })
})

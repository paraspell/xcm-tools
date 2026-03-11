import { describe, expect, it } from 'vitest'

import { InvalidAddressError, MissingParameterError, UnsupportedOperationError } from '../errors'
import { assertSender, assertSenderAddress, assertSwapSupport } from './assertions'

describe('assertions', () => {
  describe('assertSenderAddress', () => {
    it('should throw if address is undefined', () => {
      expect(() => assertSenderAddress(undefined)).toThrow(MissingParameterError)
    })
    it('should not throw if address is a string', () => {
      expect(() => assertSenderAddress('some-address')).not.toThrow()
    })
  })

  describe('assertDerivationPath', () => {
    it('should throw if path is undefined', () => {
      expect(() => assertSender(undefined)).toThrow(InvalidAddressError)
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

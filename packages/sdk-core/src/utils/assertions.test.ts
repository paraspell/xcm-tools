import { InvalidCurrencyError, type TCurrencyInput } from '@paraspell/assets'
import { describe, expect, it } from 'vitest'

import { InvalidAddressError, MissingParameterError, UnsupportedOperationError } from '../errors'
import {
  assertCurrencyCore,
  assertEvmAddress,
  assertSender,
  assertSenderSource,
  assertSwapSupport
} from './assertions'

describe('assertions', () => {
  describe('assertSender', () => {
    it('should throw if address is undefined', () => {
      expect(() => assertSender(undefined)).toThrow(MissingParameterError)
    })
    it('should not throw if address is a string', () => {
      expect(() => assertSender('some-address')).not.toThrow()
    })
  })

  describe('assertEvmAddress', () => {
    it('does not throw for a valid EVM address', () => {
      expect(() => assertEvmAddress('0x1111111111111111111111111111111111111111')).not.toThrow()
    })

    it('throws InvalidAddressError for a malformed address', () => {
      expect(() => assertEvmAddress('not-an-address')).toThrow(InvalidAddressError)
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

  describe('assertCurrencyCore', () => {
    it('passes for a symbol selector', () => {
      const value: TCurrencyInput = { symbol: 'DOT' }
      expect(() => assertCurrencyCore(value)).not.toThrow()
    })

    it('passes for an id selector', () => {
      const value: TCurrencyInput = { id: 1984 }
      expect(() => assertCurrencyCore(value)).not.toThrow()
    })

    it('passes for a string location selector', () => {
      const value: TCurrencyInput = { location: '{"parents":1,"interior":"Here"}' }
      expect(() => assertCurrencyCore(value)).not.toThrow()
    })

    it('passes for an object location selector', () => {
      const value: TCurrencyInput = { location: { parents: 1, interior: 'Here' } }
      expect(() => assertCurrencyCore(value)).not.toThrow()
    })

    it('passes for undefined (optional field)', () => {
      expect(() => assertCurrencyCore(undefined)).not.toThrow()
    })

    it('throws InvalidCurrencyError for null', () => {
      expect(() => assertCurrencyCore(null)).toThrow(InvalidCurrencyError)
    })

    it('throws InvalidCurrencyError for a multi-asset array', () => {
      const value = [{ symbol: 'DOT', amount: 1n }] as unknown as TCurrencyInput
      expect(() => assertCurrencyCore(value)).toThrow(InvalidCurrencyError)
    })
  })
})

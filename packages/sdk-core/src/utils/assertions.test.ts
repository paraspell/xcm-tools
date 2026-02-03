import { describe, expect, it } from 'vitest'

import { InvalidAddressError, MissingParameterError } from '../errors'
import { assertSender, assertSenderAddress } from './assertions'

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
})

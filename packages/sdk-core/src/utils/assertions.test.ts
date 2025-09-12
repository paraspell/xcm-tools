import { describe, expect, it } from 'vitest'

import { InvalidParameterError } from '../errors'
import { assertSenderAddress } from './assertions'

describe('assertions', () => {
  describe('assertSenderAddress', () => {
    it('should throw if address is undefined', () => {
      expect(() => assertSenderAddress(undefined)).toThrow(InvalidParameterError)
    })
    it('should not throw if address is a string', () => {
      expect(() => assertSenderAddress('some-address')).not.toThrow()
    })
  })
})

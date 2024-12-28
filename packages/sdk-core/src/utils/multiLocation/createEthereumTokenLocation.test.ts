import { describe, it, expect } from 'vitest'
import { ETHEREUM_JUNCTION } from '../../constants'
import type { TMultiLocation } from '../../types'
import { Parents } from '../../types'
import { createEthereumTokenLocation } from './createEthereumTokenLocation'

describe('createEthereumTokenLocation', () => {
  it('should create a valid Ethereum token location with the given currencyId', () => {
    const currencyId = '0x1234567890abcdef1234567890abcdef12345678'
    const expectedLocation: TMultiLocation = {
      parents: Parents.TWO,
      interior: {
        X2: [ETHEREUM_JUNCTION, { AccountKey20: { key: currencyId } }]
      }
    }

    const result = createEthereumTokenLocation(currencyId)

    expect(result).toEqual(expectedLocation)
  })
})

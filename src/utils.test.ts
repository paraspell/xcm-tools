import { describe, expect, it } from 'vitest'
import { NODE_NAMES } from './maps/consts'
import { getNodeDetails, getNodeEndpointOption, getNodeParaId } from './utils'

describe('getNodeParaId', () => {
  it('should return numeric value for all nodes', () => {
    NODE_NAMES.forEach((node) => {
      const paraId = getNodeParaId(node)
      expect(paraId).toBeTypeOf('number')
    })
  })
})

describe('getNodeDetails', () => {
  it('should return node detail for all nodes', () => {
    NODE_NAMES.forEach((node) => {
      const details = getNodeDetails(node)
      expect(details).toBeDefined()
      expect(details.name).toBeTypeOf('string')
      expect(['polkadot', 'kusama']).toContain(details.type)
    })
  })
})

describe('getNodeEndpointOption', () => {
  it('should return endpoint option for all nodes', () => {
    NODE_NAMES.forEach((node) => {
      const option = getNodeEndpointOption(node)
      expect(option).toBeDefined()
      expect(option).toHaveProperty('providers')
      expect(Object.keys(option!.providers).length).toBeGreaterThan(0)
      expect(option).toHaveProperty('paraId')
      expect(option!.paraId).toBeTypeOf('number')
    })
  })
})
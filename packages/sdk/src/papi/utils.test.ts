import type { MockInstance } from 'vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as internalUtils from '../utils'
import { createApiInstanceForNode, createPapiApiCall } from './utils'
import PapiApi from './PapiApi'
import type { TNodeWithRelayChains } from '../types'
import type { PolkadotClient } from 'polkadot-api'

vi.mock('./PapiApi')
vi.mock('../utils')

describe('API Instance and Call Utility Functions with PapiApi', () => {
  const mockNode = {} as TNodeWithRelayChains
  const mockApi = {} as PolkadotClient
  let setApiSpy: MockInstance

  beforeEach(() => {
    setApiSpy = vi.spyOn(PapiApi.prototype, 'setApi')
  })

  describe('createApiInstanceForNode', () => {
    it('should initialize PapiApi and call createApiInstanceForNode from internalUtils with the correct arguments', async () => {
      await createApiInstanceForNode(mockNode)

      expect(internalUtils.createApiInstanceForNode).toHaveBeenCalledWith(
        expect.any(PapiApi),
        mockNode
      )
    })
  })

  describe('createPapiApiCall', () => {
    it('should initialize PapiApi, set the API, and call the provided apiCall function with the correct arguments', async () => {
      const apiCall = vi.fn().mockResolvedValue('test-result')
      const options = { someArg: 'value', api: mockApi }

      const wrappedApiCall = createPapiApiCall(apiCall)
      const result = await wrappedApiCall(options)

      expect(setApiSpy).toHaveBeenCalledWith(mockApi)
      expect(apiCall).toHaveBeenCalledWith({
        ...options,
        api: expect.any(PapiApi)
      })
      expect(result).toEqual('test-result')
    })

    it('should work correctly when api is not provided in options', async () => {
      const apiCall = vi.fn().mockResolvedValue('test-result')
      const options = { someArg: 'value' } // api is not provided

      const wrappedApiCall = createPapiApiCall(apiCall)
      const result = await wrappedApiCall(options)

      expect(setApiSpy).toHaveBeenCalledWith(undefined)
      expect(apiCall).toHaveBeenCalledWith({
        ...options,
        api: expect.any(PapiApi)
      })
      expect(result).toEqual('test-result')
    })
  })
})

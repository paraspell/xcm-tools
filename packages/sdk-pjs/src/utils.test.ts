import type { MockInstance } from 'vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as sdkCore from '@paraspell/sdk-core'
import { createApiInstanceForNode, createPolkadotJsApiCall } from './utils'
import PolkadotJsApi from './PolkadotJsApi'
import type { TPjsApi } from './types'
import type { TNodeDotKsmWithRelayChains } from '@paraspell/sdk-core'

vi.mock('./PolkadotJsApi')
vi.mock('@paraspell/sdk-core')

describe('API Instance and Call Utility Functions', () => {
  const mockNode = {} as TNodeDotKsmWithRelayChains
  const mockApi = {} as TPjsApi
  let setApiSpy: MockInstance

  beforeEach(() => {
    setApiSpy = vi.spyOn(PolkadotJsApi.prototype, 'setApi')
  })

  describe('createApiInstanceForNode', () => {
    it('should initialize PolkadotJsApi and call createApiInstanceForNode from internalUtils with the correct arguments', async () => {
      await createApiInstanceForNode(mockNode)

      expect(sdkCore.createApiInstanceForNode).toHaveBeenCalledWith(
        expect.any(PolkadotJsApi),
        mockNode
      )
    })
  })

  describe('createPolkadotJsApiCall', () => {
    it('should initialize PolkadotJsApi, set the API, and call the provided apiCall function with the correct arguments', async () => {
      const apiCall = vi.fn().mockResolvedValue('test-result')
      const options = { someArg: 'value', api: mockApi }

      const wrappedApiCall = createPolkadotJsApiCall(apiCall)
      const result = await wrappedApiCall(options)

      expect(setApiSpy).toHaveBeenCalledWith(mockApi)
      expect(apiCall).toHaveBeenCalledWith({
        ...options,
        api: expect.any(PolkadotJsApi)
      })
      expect(result).toEqual('test-result')
    })

    it('should work correctly when api is not provided in options', async () => {
      const apiCall = vi.fn().mockResolvedValue('test-result')
      const options = { someArg: 'value' } // api is not provided

      const wrappedApiCall = createPolkadotJsApiCall(apiCall)
      const result = await wrappedApiCall(options)

      expect(setApiSpy).toHaveBeenCalledWith(undefined)
      expect(apiCall).toHaveBeenCalledWith({
        ...options,
        api: expect.any(PolkadotJsApi)
      })
      expect(result).toEqual('test-result')
    })
  })
})

import type { TSubstrateChain } from '@paraspell/sdk-core'
import * as sdkCore from '@paraspell/sdk-core'
import { describe, expect, it, vi } from 'vitest'

import PapiApi from './PapiApi'
import type { TPapiApi } from './types'
import { createChainClient, createPapiApiCall } from './utils'

vi.mock('./PapiApi')
vi.mock('@paraspell/sdk-core')

describe('API Instance and Call Utility Functions with PapiApi', () => {
  const mockChain = {} as TSubstrateChain
  const mockApi = {} as TPapiApi

  describe('createChainClient', () => {
    it('should initialize PapiApi and call createChainClient from internalUtils with the correct arguments', async () => {
      await createChainClient(mockChain)
      expect(sdkCore.createChainClient).toHaveBeenCalledWith(expect.any(PapiApi), mockChain)
    })
  })

  describe('createPapiApiCall', () => {
    it('should initialize PapiApi, set the API, and call the provided apiCall function with the correct arguments', async () => {
      const apiCall = vi.fn().mockResolvedValue('test-result')
      const options = { someArg: 'value', api: mockApi }

      const wrappedApiCall = createPapiApiCall(apiCall)
      const result = await wrappedApiCall(options)

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

      expect(apiCall).toHaveBeenCalledWith({
        ...options,
        api: expect.any(PapiApi)
      })
      expect(result).toEqual('test-result')
    })
  })
})

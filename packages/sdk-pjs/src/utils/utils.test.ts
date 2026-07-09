import type { TSubstrateChain } from '@paraspell/sdk-core'
import * as sdkCore from '@paraspell/sdk-core'
import { describe, expect, it, vi } from 'vitest'

import PolkadotJsApi from '../PolkadotJsApi'
import type { TPjsApi } from '../types'
import { createChainClient, createPolkadotJsApiCall } from './utils'

vi.mock('./PolkadotJsApi')
vi.mock('@paraspell/sdk-core', async importActual => ({
  ...(await importActual()),
  createChainClient: vi.fn()
}))

describe('API Instance and Call Utility Functions', () => {
  const mockChain: TSubstrateChain = 'Acala'
  const mockApi = {} as TPjsApi

  describe('createChainClient', () => {
    it('should initialize PolkadotJsApi and call createChainClient from internalUtils with the correct arguments', async () => {
      await createChainClient(mockChain)

      expect(sdkCore.createChainClient).toHaveBeenCalledWith(expect.any(PolkadotJsApi), mockChain)
    })
  })

  describe('createPolkadotJsApiCall', () => {
    it('should initialize PolkadotJsApi, set the API, and call the provided apiCall function with the correct arguments', async () => {
      const apiCall = vi.fn().mockResolvedValue('test-result')
      const options = { someArg: 'value', api: mockApi }

      const wrappedApiCall = createPolkadotJsApiCall(apiCall)
      const result = await wrappedApiCall(options)

      expect(apiCall).toHaveBeenCalledWith({
        ...options,
        api: expect.any(PolkadotJsApi)
      })
      expect(result).toEqual('test-result')
    })

    it('should work correctly when api is not provided in options', async () => {
      const apiCall = vi.fn().mockResolvedValue('test-result')
      const options = {} // api is not provided

      const wrappedApiCall = createPolkadotJsApiCall(apiCall)
      const result = await wrappedApiCall(options)

      expect(apiCall).toHaveBeenCalledWith({
        ...options,
        api: expect.any(PolkadotJsApi)
      })
      expect(result).toEqual('test-result')
    })
  })
})

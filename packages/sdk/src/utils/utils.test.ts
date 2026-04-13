import type { TSubstrateChain } from '@paraspell/sdk-core'
import * as sdkCore from '@paraspell/sdk-core'
import { describe, expect, it, vi } from 'vitest'

import PapiApi from '../PapiApi'
import type { TPapiApi } from '../types'
import { createChainClient, createPapiApiCall, extractDestParaId, findFailingEvent } from './utils'

vi.mock('@paraspell/sdk-core', async importActual => ({
  ...(await importActual()),
  createChainClient: vi.fn()
}))

vi.mock('./PapiApi')

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

describe('findFailingEvent', () => {
  it('returns undefined if result has no value', () => {
    const result = {}
    expect(findFailingEvent(result)).toBeUndefined()
  })

  it('returns undefined if no emitted_events', () => {
    const result = { value: {} }
    expect(findFailingEvent(result)).toBeUndefined()
  })

  it('returns undefined if no Utility events', () => {
    const result = {
      value: {
        emitted_events: [{ type: 'Balances', value: { type: 'Transfer', value: {} } }]
      }
    }
    expect(findFailingEvent(result)).toBeUndefined()
  })

  it('returns undefined if Utility event is not DispatchedAs', () => {
    const result = {
      value: {
        emitted_events: [{ type: 'Utility', value: { type: 'BatchCompleted', value: {} } }]
      }
    }
    expect(findFailingEvent(result)).toBeUndefined()
  })

  it('returns undefined if DispatchedAs result is successful', () => {
    const result = {
      value: {
        emitted_events: [
          {
            type: 'Utility',
            value: {
              type: 'DispatchedAs',
              value: { result: { success: true } }
            }
          }
        ]
      }
    }
    expect(findFailingEvent(result)).toBeUndefined()
  })

  it('returns the event if DispatchedAs result is failed', () => {
    const failingEvent = {
      type: 'Utility',
      value: {
        type: 'DispatchedAs',
        value: { result: { success: false } }
      }
    }

    const result = {
      value: {
        emitted_events: [failingEvent]
      }
    }

    expect(findFailingEvent(result)).toBe(failingEvent)
  })

  it('returns the first failing event if multiple are present', () => {
    const failingEvent1 = {
      type: 'Utility',
      value: {
        type: 'DispatchedAs',
        value: { result: { success: false } }
      }
    }
    const failingEvent2 = {
      type: 'Utility',
      value: {
        type: 'DispatchedAs',
        value: { result: { success: false } }
      }
    }
    const result = {
      value: {
        emitted_events: [failingEvent1, failingEvent2]
      }
    }

    expect(findFailingEvent(result)).toBe(failingEvent1)
  })
})

describe('extractDestParaId', () => {
  it('returns undefined for empty array', () => {
    expect(extractDestParaId([])).toBeUndefined()
  })

  it('returns 0 when interior type is Here', () => {
    const forwardedXcms = [{ value: { interior: { type: 'Here' } } }]
    expect(extractDestParaId(forwardedXcms)).toBe(0)
  })

  it('returns parachain id when interior is X1 with Parachain', () => {
    const forwardedXcms = [
      { value: { interior: { type: 'X1', value: { type: 'Parachain', value: 2000 } } } }
    ]
    expect(extractDestParaId(forwardedXcms)).toBe(2000)
  })

  it('returns undefined when interior is X1 but not Parachain', () => {
    const forwardedXcms = [
      { value: { interior: { type: 'X1', value: { type: 'AccountId32', value: '0x123' } } } }
    ]
    expect(extractDestParaId(forwardedXcms)).toBeUndefined()
  })

  it('returns undefined for unrecognized interior type', () => {
    const forwardedXcms = [{ value: { interior: { type: 'X2', value: {} } } }]
    expect(extractDestParaId(forwardedXcms)).toBeUndefined()
  })
})

import type { MockInstance } from 'vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as sdkCore from '@paraspell/sdk-core'
import PapiApi from './PapiApi'
import type { TPapiApi, TPapiApiOrUrl, TPapiTransaction } from './types'
import type { TSendOptions } from '@paraspell/sdk-core'
import { send } from './transfer'

vi.mock('./PapiApi')
vi.mock('@paraspell/sdk-core')

describe('Send function using PapiApi', () => {
  const mockApi = {} as TPapiApi
  const mockDestApi = {} as TPapiApi

  const optionsSend: Omit<
    TSendOptions<TPapiApi, TPapiTransaction>,
    'api' | 'destApiForKeepAlive'
  > & {
    api: TPapiApiOrUrl
    destApiForKeepAlive: TPapiApiOrUrl
  } = {
    api: mockApi,
    destApiForKeepAlive: mockDestApi
  } as Omit<TSendOptions<TPapiApi, TPapiTransaction>, 'api' | 'destApiForKeepAlive'> & {
    api: TPapiApiOrUrl
    destApiForKeepAlive: TPapiApiOrUrl
  }

  let papiApiSetApiSpy: MockInstance
  let destPapiApiSetApiSpy: MockInstance

  beforeEach(() => {
    papiApiSetApiSpy = vi.spyOn(PapiApi.prototype, 'setApi')
    destPapiApiSetApiSpy = vi.spyOn(PapiApi.prototype, 'setApi')
  })

  describe('send', () => {
    it('should call setApi on papiApi and destPapiApi, and call send in transferImpl with correct arguments', async () => {
      await send(optionsSend)

      expect(papiApiSetApiSpy).toHaveBeenCalledWith(mockApi)
      expect(destPapiApiSetApiSpy).toHaveBeenCalledWith(mockDestApi)
      expect(sdkCore.send).toHaveBeenCalledWith({
        ...optionsSend,
        api: expect.any(PapiApi),
        destApiForKeepAlive: expect.any(PapiApi)
      })
    })
  })
})

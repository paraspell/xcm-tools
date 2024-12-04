import type { MockInstance } from 'vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as transferImpl from '../pallets/xcmPallet/transfer'
import { send } from './transfer'
import PapiApi from './PapiApi'
import type { TPapiApi, TPapiApiOrUrl, TPapiTransaction } from './types'
import type { TSendOptions } from '../types'

vi.mock('./PapiApi')
vi.mock('../pallets/xcmPallet/transfer')

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
      expect(transferImpl.send).toHaveBeenCalledWith({
        ...optionsSend,
        api: expect.any(PapiApi),
        destApiForKeepAlive: expect.any(PapiApi)
      })
    })
  })
})

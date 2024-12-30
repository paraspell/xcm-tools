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

  const optionsSend = {
    api: mockApi
  } as Omit<TSendOptions<TPapiApi, TPapiTransaction>, 'api'> & {
    api: TPapiApiOrUrl
  }

  let papiApiSetApiSpy: MockInstance

  beforeEach(() => {
    papiApiSetApiSpy = vi.spyOn(PapiApi.prototype, 'setApi')
  })

  describe('send', () => {
    it('should call setApi on papiApi and destPapiApi, and call send in transferImpl with correct arguments', async () => {
      await send(optionsSend)

      expect(papiApiSetApiSpy).toHaveBeenCalledWith(mockApi)
      expect(sdkCore.send).toHaveBeenCalledWith({
        ...optionsSend,
        api: expect.any(PapiApi)
      })
    })
  })
})

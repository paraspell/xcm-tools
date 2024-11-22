import type { MockInstance } from 'vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as transferImpl from '../pallets/xcmPallet/transfer'
import PolkadotJsApi from './PolkadotJsApi'
import type { Extrinsic, TPjsApi, TPjsApiOrUrl } from './types'
import type { TRelayToParaOptions, TSendOptions } from '../types'
import { send, transferRelayToPara } from './transfer'

vi.mock('./PolkadotJsApi')
vi.mock('../pallets/xcmPallet/transfer')

describe('Relay Transfer and Send Functions', () => {
  const mockApi = {} as TPjsApi
  const mockDestApi = {} as TPjsApi

  const optionsRelayToPara: Omit<
    TRelayToParaOptions<TPjsApi, Extrinsic>,
    'api' | 'destApiForKeepAlive'
  > & {
    api: TPjsApiOrUrl
    destApiForKeepAlive: TPjsApiOrUrl
  } = {
    api: mockApi,
    destApiForKeepAlive: mockDestApi
  } as unknown as Omit<TRelayToParaOptions<TPjsApi, Extrinsic>, 'api' | 'destApiForKeepAlive'> & {
    api: TPjsApiOrUrl
    destApiForKeepAlive: TPjsApiOrUrl
  }

  const optionsSend: Omit<TSendOptions<TPjsApi, Extrinsic>, 'api' | 'destApiForKeepAlive'> & {
    api: TPjsApiOrUrl
    destApiForKeepAlive: TPjsApiOrUrl
  } = {
    api: mockApi,
    destApiForKeepAlive: mockDestApi
  } as unknown as Omit<TSendOptions<TPjsApi, Extrinsic>, 'api' | 'destApiForKeepAlive'> & {
    api: TPjsApiOrUrl
    destApiForKeepAlive: TPjsApiOrUrl
  }

  let pjsApiSetApiSpy: MockInstance
  let destPjsApiSetApiSpy: MockInstance

  beforeEach(() => {
    pjsApiSetApiSpy = vi.spyOn(PolkadotJsApi.prototype, 'setApi')
    destPjsApiSetApiSpy = vi.spyOn(PolkadotJsApi.prototype, 'setApi')
  })

  describe('transferRelayToPara', () => {
    it('should call setApi on pjsApi and destPjsApi, and call transferRelayToPara in transferImpl with correct arguments', async () => {
      await transferRelayToPara(optionsRelayToPara)

      expect(pjsApiSetApiSpy).toHaveBeenCalledWith(mockApi)
      expect(destPjsApiSetApiSpy).toHaveBeenCalledWith(mockDestApi)
      expect(transferImpl.transferRelayToPara).toHaveBeenCalledWith({
        ...optionsRelayToPara,
        api: expect.any(PolkadotJsApi),
        destApiForKeepAlive: expect.any(PolkadotJsApi)
      })
    })
  })

  describe('send', () => {
    it('should call setApi on pjsApi and destPjsApi, and call send in transferImpl with correct arguments', async () => {
      await send(optionsSend)

      expect(pjsApiSetApiSpy).toHaveBeenCalledWith(mockApi)
      expect(destPjsApiSetApiSpy).toHaveBeenCalledWith(mockDestApi)
      expect(transferImpl.send).toHaveBeenCalledWith({
        ...optionsSend,
        api: expect.any(PolkadotJsApi),
        destApiForKeepAlive: expect.any(PolkadotJsApi)
      })
    })
  })
})

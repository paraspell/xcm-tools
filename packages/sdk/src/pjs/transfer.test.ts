import type { MockInstance } from 'vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as transferImpl from '../pallets/xcmPallet/transfer'
import PolkadotJsApi from './PolkadotJsApi'
import type { ApiPromise } from '@polkadot/api'
import type { Extrinsic } from './types'
import type { TRelayToParaOptions, TSendOptions } from '../types'
import {
  send,
  sendSerializedApiCall,
  transferRelayToPara,
  transferRelayToParaSerializedApiCall
} from './transfer'

vi.mock('./PolkadotJsApi')
vi.mock('../pallets/xcmPallet/transfer')

describe('Relay Transfer and Send Functions', () => {
  const mockApi = {} as ApiPromise
  const mockDestApi = {} as ApiPromise

  const optionsRelayToPara: Omit<
    TRelayToParaOptions<ApiPromise, Extrinsic>,
    'api' | 'destApiForKeepAlive'
  > & {
    api: ApiPromise
    destApiForKeepAlive: ApiPromise
  } = {
    api: mockApi,
    destApiForKeepAlive: mockDestApi
  } as unknown as Omit<
    TRelayToParaOptions<ApiPromise, Extrinsic>,
    'api' | 'destApiForKeepAlive'
  > & {
    api: ApiPromise
    destApiForKeepAlive: ApiPromise
  }

  const optionsSend: Omit<TSendOptions<ApiPromise, Extrinsic>, 'api' | 'destApiForKeepAlive'> & {
    api: ApiPromise
    destApiForKeepAlive: ApiPromise
  } = {
    api: mockApi,
    destApiForKeepAlive: mockDestApi
  } as unknown as Omit<TSendOptions<ApiPromise, Extrinsic>, 'api' | 'destApiForKeepAlive'> & {
    api: ApiPromise
    destApiForKeepAlive: ApiPromise
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

  describe('transferRelayToParaSerializedApiCall', () => {
    it('should call setApi on pjsApi and destPjsApi, and call transferRelayToParaSerializedApiCall in transferImpl with correct arguments', async () => {
      await transferRelayToParaSerializedApiCall(optionsRelayToPara)

      expect(pjsApiSetApiSpy).toHaveBeenCalledWith(mockApi)
      expect(destPjsApiSetApiSpy).toHaveBeenCalledWith(mockDestApi)
      expect(transferImpl.transferRelayToParaSerializedApiCall).toHaveBeenCalledWith({
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

  describe('sendSerializedApiCall', () => {
    it('should call setApi on pjsApi and destPjsApi, and call sendSerializedApiCall in transferImpl with correct arguments', async () => {
      await sendSerializedApiCall(optionsSend)

      expect(pjsApiSetApiSpy).toHaveBeenCalledWith(mockApi)
      expect(destPjsApiSetApiSpy).toHaveBeenCalledWith(mockDestApi)
      expect(transferImpl.sendSerializedApiCall).toHaveBeenCalledWith({
        ...optionsSend,
        api: expect.any(PolkadotJsApi),
        destApiForKeepAlive: expect.any(PolkadotJsApi)
      })
    })
  })
})

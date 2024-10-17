import type { MockInstance } from 'vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as transferImpl from '../pallets/xcmPallet/transfer'
import {
  transferRelayToPara,
  transferRelayToParaSerializedApiCall,
  send,
  sendSerializedApiCall
} from './transfer'
import PapiApi from './PapiApi'
import type { PolkadotClient } from 'polkadot-api'
import type { TPapiTransaction } from './types'
import type { TRelayToParaOptions, TSendOptions } from '../types'

vi.mock('./PapiApi')
vi.mock('../pallets/xcmPallet/transfer')

describe('Relay Transfer and Send Functions using PapiApi', () => {
  const mockApi = {} as PolkadotClient
  const mockDestApi = {} as PolkadotClient

  const optionsRelayToPara: Omit<
    TRelayToParaOptions<PolkadotClient, TPapiTransaction>,
    'api' | 'destApiForKeepAlive'
  > & {
    api: PolkadotClient
    destApiForKeepAlive: PolkadotClient
  } = {
    api: mockApi,
    destApiForKeepAlive: mockDestApi
  } as Omit<
    TRelayToParaOptions<PolkadotClient, TPapiTransaction>,
    'api' | 'destApiForKeepAlive'
  > & {
    api: PolkadotClient
    destApiForKeepAlive: PolkadotClient
  }

  const optionsSend: Omit<
    TSendOptions<PolkadotClient, TPapiTransaction>,
    'api' | 'destApiForKeepAlive'
  > & {
    api: PolkadotClient
    destApiForKeepAlive: PolkadotClient
  } = {
    api: mockApi,
    destApiForKeepAlive: mockDestApi
  } as Omit<TSendOptions<PolkadotClient, TPapiTransaction>, 'api' | 'destApiForKeepAlive'> & {
    api: PolkadotClient
    destApiForKeepAlive: PolkadotClient
  }

  let papiApiSetApiSpy: MockInstance
  let destPapiApiSetApiSpy: MockInstance

  beforeEach(() => {
    papiApiSetApiSpy = vi.spyOn(PapiApi.prototype, 'setApi')
    destPapiApiSetApiSpy = vi.spyOn(PapiApi.prototype, 'setApi')
  })

  describe('transferRelayToPara', () => {
    it('should call setApi on papiApi and destPapiApi, and call transferRelayToPara in transferImpl with correct arguments', async () => {
      await transferRelayToPara(optionsRelayToPara)

      expect(papiApiSetApiSpy).toHaveBeenCalledWith(mockApi)
      expect(destPapiApiSetApiSpy).toHaveBeenCalledWith(mockDestApi)
      expect(transferImpl.transferRelayToPara).toHaveBeenCalledWith({
        ...optionsRelayToPara,
        api: expect.any(PapiApi),
        destApiForKeepAlive: expect.any(PapiApi)
      })
    })
  })

  describe('transferRelayToParaSerializedApiCall', () => {
    it('should call setApi on papiApi and destPapiApi, and call transferRelayToParaSerializedApiCall in transferImpl with correct arguments', async () => {
      await transferRelayToParaSerializedApiCall(optionsRelayToPara)

      expect(papiApiSetApiSpy).toHaveBeenCalledWith(mockApi)
      expect(destPapiApiSetApiSpy).toHaveBeenCalledWith(mockDestApi)
      expect(transferImpl.transferRelayToParaSerializedApiCall).toHaveBeenCalledWith({
        ...optionsRelayToPara,
        api: expect.any(PapiApi),
        destApiForKeepAlive: expect.any(PapiApi)
      })
    })
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

  describe('sendSerializedApiCall', () => {
    it('should call setApi on papiApi and destPapiApi, and call sendSerializedApiCall in transferImpl with correct arguments', async () => {
      await sendSerializedApiCall(optionsSend)

      expect(papiApiSetApiSpy).toHaveBeenCalledWith(mockApi)
      expect(destPapiApiSetApiSpy).toHaveBeenCalledWith(mockDestApi)
      expect(transferImpl.sendSerializedApiCall).toHaveBeenCalledWith({
        ...optionsSend,
        api: expect.any(PapiApi),
        destApiForKeepAlive: expect.any(PapiApi)
      })
    })
  })
})

import type { MockInstance } from 'vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as transferImpl from '../pallets/xcmPallet/transfer'
import * as ethTransferImpl from '../pallets/xcmPallet/ethTransfer/ethTransfer'
import PolkadotJsApi from './PolkadotJsApi'
import type { Extrinsic, TPjsApi, TPjsApiOrUrl } from './types'
import type { TEvmBuilderOptions, TSendOptions } from '../types'
import { send, transferEthToPolkadot } from './transfer'

vi.mock('./PolkadotJsApi')
vi.mock('../pallets/xcmPallet/transfer')
vi.mock('../pallets/xcmPallet/ethTransfer/ethTransfer')

describe('Send Function using PolkadotJsAPI', () => {
  const mockApi = {} as TPjsApi
  const mockDestApi = {} as TPjsApi

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

  describe('transferEthToPolkadot', () => {
    it('should call transferEthToPolkadot in ethTransferImpl with correct arguments', async () => {
      const options = {} as TEvmBuilderOptions<TPjsApi, Extrinsic>

      await transferEthToPolkadot(options)

      expect(ethTransferImpl.transferEthToPolkadot).toHaveBeenCalledWith({
        ...options,
        api: expect.any(PolkadotJsApi)
      })
    })
  })
})

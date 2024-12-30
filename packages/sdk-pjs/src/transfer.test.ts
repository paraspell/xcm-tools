import type { MockInstance } from 'vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as sdkCore from '@paraspell/sdk-core'
import PolkadotJsApi from './PolkadotJsApi'
import type { Extrinsic, TPjsApi, TPjsApiOrUrl } from './types'
import { send, transferEthToPolkadot } from './transfer'
import { transferEthToPolkadot as transferEthToPolkadotImpl } from './ethTransfer'
import type { TEvmBuilderOptions, TSendOptions } from '@paraspell/sdk-core'

vi.mock('./PolkadotJsApi')

vi.mock('./ethTransfer', () => ({
  transferEthToPolkadot: vi.fn()
}))

vi.mock('@paraspell/sdk-core', async importOriginal => {
  return {
    ...(await importOriginal<typeof import('@paraspell/sdk-core')>()),
    send: vi.fn()
  }
})

describe('Send Function using PolkadotJsAPI', () => {
  const mockApi = {} as TPjsApi

  const optionsSend = {
    api: mockApi
  } as unknown as Omit<TSendOptions<TPjsApi, Extrinsic>, 'api'> & {
    api: TPjsApiOrUrl
  }

  let pjsApiSetApiSpy: MockInstance

  beforeEach(() => {
    pjsApiSetApiSpy = vi.spyOn(PolkadotJsApi.prototype, 'setApi')
  })

  describe('send', () => {
    it('should call setApi on pjsApi and destPjsApi, and call send in transferImpl with correct arguments', async () => {
      await send(optionsSend)

      expect(pjsApiSetApiSpy).toHaveBeenCalledWith(mockApi)
      expect(sdkCore.send).toHaveBeenCalledWith({
        ...optionsSend,
        api: expect.any(PolkadotJsApi)
      })
    })
  })

  describe('transferEthToPolkadot', () => {
    it('should call transferEthToPolkadot in ethTransferImpl with correct arguments', async () => {
      const options = {
        provider: {},
        signer: {
          provider: {}
        },
        currency: {
          symbol: 'ETH'
        }
      } as TEvmBuilderOptions<TPjsApi, Extrinsic>

      await transferEthToPolkadot(options)

      expect(transferEthToPolkadotImpl).toHaveBeenCalledWith({
        ...options,
        api: expect.any(PolkadotJsApi)
      })
    })
  })
})

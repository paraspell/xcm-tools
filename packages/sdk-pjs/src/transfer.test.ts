import type { TEvmBuilderOptions, TSendOptions } from '@paraspell/sdk-core'
import * as sdkCore from '@paraspell/sdk-core'
import type { MockInstance } from 'vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { transferEthToPolkadot as transferEthToPolkadotImpl } from './ethTransfer'
import PolkadotJsApi from './PolkadotJsApi'
import { getBridgeStatus, getParaEthTransferFees, send, transferEthToPolkadot } from './transfer'
import type { Extrinsic, TPjsApi, TPjsApiOrUrl } from './types'

vi.mock('./PolkadotJsApi')

vi.mock('./ethTransfer', () => ({
  transferEthToPolkadot: vi.fn()
}))

vi.mock('@paraspell/sdk-core', async importOriginal => {
  return {
    ...(await importOriginal<typeof import('@paraspell/sdk-core')>()),
    send: vi.fn(),
    getBridgeStatus: vi.fn(),
    getParaEthTransferFees: vi.fn()
  }
})

describe('Send Function using PolkadotJsAPI', () => {
  const mockApi = {} as TPjsApi

  const options = {
    api: mockApi
  } as unknown as Omit<TSendOptions<TPjsApi, Extrinsic>, 'api'> & {
    api: TPjsApiOrUrl
  }

  let pjsApiSetApiSpy: MockInstance
  let pjsApiInitSpy: MockInstance

  beforeEach(() => {
    pjsApiSetApiSpy = vi.spyOn(PolkadotJsApi.prototype, 'setApi')
    pjsApiInitSpy = vi.spyOn(PolkadotJsApi.prototype, 'init')
  })

  describe('send', () => {
    it('should call setApi on pjsApi and destPjsApi, and call send in transferImpl with correct arguments', async () => {
      await send(options)

      expect(pjsApiSetApiSpy).toHaveBeenCalledWith(mockApi)
      expect(sdkCore.send).toHaveBeenCalledWith({
        ...options,
        api: expect.any(PolkadotJsApi)
      })
    })
  })

  describe('getBridgeStatus', () => {
    it('should call getBridgeStatus from SDK-Core', async () => {
      await getBridgeStatus(options.api)

      expect(sdkCore.getBridgeStatus).toHaveBeenCalledWith(expect.any(PolkadotJsApi))
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

  describe('getParaEthTransferFees', () => {
    it('should call setApi on pjsApi and destPjsApi, and call getParaEthTransferFees in transferImpl with correct arguments', async () => {
      await getParaEthTransferFees(mockApi)

      expect(pjsApiSetApiSpy).toHaveBeenCalledWith(mockApi)
      expect(pjsApiInitSpy).toHaveBeenCalledWith(
        'AssetHubPolkadot',
        sdkCore.DRY_RUN_CLIENT_TIMEOUT_MS
      )
      expect(sdkCore.getParaEthTransferFees).toHaveBeenCalledWith(expect.any(PolkadotJsApi))
    })
  })
})

import type {
  TCreateBaseSwapXcmOptions,
  TGetXcmFeeBaseOptions,
  TSendOptions
} from '@paraspell/sdk-core'
import * as sdkCore from '@paraspell/sdk-core'
import type { MockInstance } from 'vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import PapiApi from './PapiApi'
import {
  getBridgeStatus,
  getParaEthTransferFees,
  getXcmFee,
  handleSwapExecuteTransfer,
  send
} from './transfer'
import type { TPapiApi, TPapiApiOrUrl, TPapiTransaction } from './types'

vi.mock('@paraspell/sdk-core')

vi.mock('./PapiApi')

describe('Send function using PapiApi', () => {
  const mockApi = {} as TPapiApi

  const options = {
    api: mockApi
  } as Omit<TSendOptions<TPapiApi, TPapiTransaction>, 'api'> & {
    api: TPapiApiOrUrl
  }

  let papiApiInitSpy: MockInstance

  beforeEach(() => {
    papiApiInitSpy = vi.spyOn(PapiApi.prototype, 'init')
  })

  describe('send', () => {
    it('should call setApi on papiApi and destPapiApi, and call send in transferImpl with correct arguments', async () => {
      await send(options)

      expect(sdkCore.send).toHaveBeenCalledWith({
        ...options,
        api: expect.any(PapiApi)
      })
    })
  })

  describe('getBridgeStatus', () => {
    it('should call getBridgeStatus from SDK-Core', async () => {
      await getBridgeStatus(options.api)

      expect(sdkCore.getBridgeStatus).toHaveBeenCalledWith(expect.any(PapiApi))
    })
  })

  describe('getParaEthTransferFees', () => {
    it('should call setApi on papiApi and destPapiApi, and call getParaEthTransferFees in transferImpl with correct arguments', async () => {
      await getParaEthTransferFees(mockApi)

      expect(papiApiInitSpy).toHaveBeenCalledWith('AssetHubPolkadot')
      expect(sdkCore.getParaEthTransferFees).toHaveBeenCalledWith(expect.any(PapiApi))
    })
  })

  describe('getXcmFee', () => {
    it('should call getXcmFee from SDK-Core with PapiApi instance', async () => {
      const testOptions = {} as TGetXcmFeeBaseOptions<TPapiTransaction, false>

      await getXcmFee(testOptions)

      expect(sdkCore.getXcmFee).toHaveBeenCalledWith({
        ...testOptions,
        api: expect.any(PapiApi)
      })
    })
  })

  describe('handleSwapExecuteTransfer', () => {
    it('should call handleSwapExecuteTransfer from SDK-Core with PapiApi instance', async () => {
      const swapOptions = {} as TCreateBaseSwapXcmOptions

      await handleSwapExecuteTransfer(swapOptions)

      expect(sdkCore.handleSwapExecuteTransfer).toHaveBeenCalledWith({
        ...swapOptions,
        api: expect.any(PapiApi)
      })
    })
  })
})

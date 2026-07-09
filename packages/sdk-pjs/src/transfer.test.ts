import type { TApiOrUrl, TTransferOptions } from '@paraspell/sdk-core'
import * as sdkCore from '@paraspell/sdk-core'
import type { MockInstance } from 'vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import PolkadotJsApi from './PolkadotJsApi'
import { getBridgeStatus, getParaEthTransferFees } from './transfer'
import type { Extrinsic, TPjsApi, TPjsSigner } from './types'

vi.mock('./PolkadotJsApi')

vi.mock('@paraspell/sdk-core', async importOriginal => {
  return {
    ...(await importOriginal<typeof import('@paraspell/sdk-core')>()),
    getBridgeStatus: vi.fn(),
    getParaEthTransferFees: vi.fn()
  }
})

describe('Transfer function using PolkadotJsAPI', () => {
  const mockApi = {} as TPjsApi

  const options = {
    api: mockApi
  } as unknown as Omit<TTransferOptions<TPjsApi, Extrinsic, TPjsSigner>, 'api'> & {
    api: TApiOrUrl<TPjsApi>
  }

  let pjsApiInitSpy: MockInstance

  beforeEach(() => {
    pjsApiInitSpy = vi.spyOn(PolkadotJsApi.prototype, 'init')
  })

  describe('getBridgeStatus', () => {
    it('should call getBridgeStatus from SDK-Core', async () => {
      await getBridgeStatus(options.api)

      expect(sdkCore.getBridgeStatus).toHaveBeenCalledWith(expect.any(PolkadotJsApi))
    })
  })

  describe('getParaEthTransferFees', () => {
    it('should call setApi on pjsApi and destPjsApi, and call getParaEthTransferFees in transferImpl with correct arguments', async () => {
      await getParaEthTransferFees(mockApi)

      expect(pjsApiInitSpy).toHaveBeenCalledWith(
        'AssetHubPolkadot',
        sdkCore.DRY_RUN_CLIENT_TIMEOUT_MS
      )
      expect(sdkCore.getParaEthTransferFees).toHaveBeenCalledWith(expect.any(PolkadotJsApi))
    })
  })
})

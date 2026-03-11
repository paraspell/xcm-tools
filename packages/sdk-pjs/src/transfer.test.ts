import type { TSendOptions } from '@paraspell/sdk-core'
import * as sdkCore from '@paraspell/sdk-core'
import type { MockInstance } from 'vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { transferEthToPolkadot as transferEthToPolkadotImpl } from './ethTransfer'
import PolkadotJsApi from './PolkadotJsApi'
import { getBridgeStatus, getParaEthTransferFees, transferEthToPolkadot } from './transfer'
import type { Extrinsic, TPjsApi, TPjsApiOrUrl, TPjsEvmBuilderOptions, TPjsSigner } from './types'

vi.mock('./PolkadotJsApi')

vi.mock('./ethTransfer')

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
  } as unknown as Omit<TSendOptions<TPjsApi, Extrinsic, TPjsSigner>, 'api'> & {
    api: TPjsApiOrUrl
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
      } as TPjsEvmBuilderOptions<TPjsApi, Extrinsic, TPjsSigner>

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

      expect(pjsApiInitSpy).toHaveBeenCalledWith(
        'AssetHubPolkadot',
        sdkCore.DRY_RUN_CLIENT_TIMEOUT_MS
      )
      expect(sdkCore.getParaEthTransferFees).toHaveBeenCalledWith(expect.any(PolkadotJsApi))
    })
  })
})

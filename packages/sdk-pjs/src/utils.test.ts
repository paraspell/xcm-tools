import type { TNodeDotKsmWithRelayChains } from '@paraspell/sdk-core'
import * as sdkCore from '@paraspell/sdk-core'
import type { Contract, Signer } from 'ethers'
import type { Abi, GetContractReturnType, WalletClient } from 'viem'
import type { MockInstance } from 'vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import PolkadotJsApi from './PolkadotJsApi'
import type { TPjsApi } from './types'
import {
  createApiInstanceForNode,
  createPolkadotJsApiCall,
  isEthersContract,
  isEthersSigner
} from './utils'

vi.mock('./PolkadotJsApi')
vi.mock('@paraspell/sdk-core')

describe('API Instance and Call Utility Functions', () => {
  const mockNode = {} as TNodeDotKsmWithRelayChains
  const mockApi = {} as TPjsApi
  let setApiSpy: MockInstance

  beforeEach(() => {
    setApiSpy = vi.spyOn(PolkadotJsApi.prototype, 'setApi')
  })

  describe('createApiInstanceForNode', () => {
    it('should initialize PolkadotJsApi and call createApiInstanceForNode from internalUtils with the correct arguments', async () => {
      await createApiInstanceForNode(mockNode)

      expect(sdkCore.createApiInstanceForNode).toHaveBeenCalledWith(
        expect.any(PolkadotJsApi),
        mockNode
      )
    })
  })

  describe('createPolkadotJsApiCall', () => {
    it('should initialize PolkadotJsApi, set the API, and call the provided apiCall function with the correct arguments', async () => {
      const apiCall = vi.fn().mockResolvedValue('test-result')
      const options = { someArg: 'value', api: mockApi }

      const wrappedApiCall = createPolkadotJsApiCall(apiCall)
      const result = await wrappedApiCall(options)

      expect(setApiSpy).toHaveBeenCalledWith(mockApi)
      expect(apiCall).toHaveBeenCalledWith({
        ...options,
        api: expect.any(PolkadotJsApi)
      })
      expect(result).toEqual('test-result')
    })

    it('should work correctly when api is not provided in options', async () => {
      const apiCall = vi.fn().mockResolvedValue('test-result')
      const options = { someArg: 'value' } // api is not provided

      const wrappedApiCall = createPolkadotJsApiCall(apiCall)
      const result = await wrappedApiCall(options)

      expect(setApiSpy).toHaveBeenCalledWith(undefined)
      expect(apiCall).toHaveBeenCalledWith({
        ...options,
        api: expect.any(PolkadotJsApi)
      })
      expect(result).toEqual('test-result')
    })
  })
})

describe('isEthersSigner', () => {
  it('returns true when the object has a provider property', () => {
    const mockEthersSigner = { provider: {} } as unknown as Signer
    expect(isEthersSigner(mockEthersSigner)).toBe(true)
  })

  it('returns false when the object does not have a provider property', () => {
    const mockWalletClient = { chain: {} } as WalletClient
    expect(isEthersSigner(mockWalletClient)).toBe(false)
  })

  it('returns false when given null', () => {
    expect(isEthersSigner(null as unknown as Signer | WalletClient)).toBe(false)
  })

  it('returns false when given a non-object type', () => {
    expect(isEthersSigner('not-an-object' as unknown as Signer | WalletClient)).toBe(false)
  })
})

describe('isEthersContract', () => {
  it('returns true for an Ethers Contract (no "abi" property)', () => {
    const mockEthersContract = {} as Contract
    expect(isEthersContract(mockEthersContract)).toBe(true)
  })

  it('returns false for a viem contract (has "abi" property)', () => {
    const mockViemContract = { abi: [] } as unknown as GetContractReturnType<Abi>
    expect(isEthersContract(mockViemContract)).toBe(false)
  })
})

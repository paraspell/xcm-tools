import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { ApiPromise } from '@polkadot/api'
import PolkadotJsApi from './PolkadotJsApi'

describe('PolkadotJsApi', () => {
  let polkadotApi: PolkadotJsApi
  let mockApiPromise: ApiPromise

  beforeEach(() => {
    polkadotApi = new PolkadotJsApi()
    mockApiPromise = {
      createType: vi.fn().mockReturnValue({
        toHex: vi.fn().mockReturnValue('0x1234567890abcdef')
      }),
      tx: {
        balances: {
          transfer: vi.fn().mockReturnValue('mocked_extrinsic')
        }
      }
    } as unknown as ApiPromise
    polkadotApi.init(mockApiPromise)
  })

  describe('createAccountId', () => {
    it('should return a hex string representation of the AccountId', () => {
      const address = '5F3sa2TJAWMqDhXG6jhV4N8ko9gKph2TGpR67TgeSmDTZyDg'

      const spy = vi.spyOn(mockApiPromise, 'createType')

      const result = polkadotApi.createAccountId(address)

      expect(spy).toHaveBeenCalledWith('AccountId32', address)
      expect(result).toBe('0x1234567890abcdef')
    })
  })

  describe('call', () => {
    it('should create an extrinsic with the provided module, section, and parameters', () => {
      const serializedCall = {
        module: 'balances',
        section: 'transfer',
        parameters: ['recipient_address', 1000]
      }

      const result = polkadotApi.call(serializedCall)

      expect(mockApiPromise.tx.balances.transfer).toHaveBeenCalledWith('recipient_address', 1000)
      expect(result).toBe('mocked_extrinsic')
    })
  })
})

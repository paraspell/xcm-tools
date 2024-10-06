import { describe, it, expect, vi } from 'vitest'
import type { ApiPromise } from '@polkadot/api'
import type { TSerializedApiCall, Extrinsic } from '../types'
import { callPolkadotJsTxFunction } from './callPolkadotJsTxFunction'

const apiMock = {
  tx: {
    balances: {
      transfer: vi.fn()
    }
  }
} as unknown as ApiPromise

describe('callPolkadotJsTxFunction', () => {
  it('should call the correct function on the PolkadotJS API with the provided parameters', () => {
    const serializedCall: TSerializedApiCall = {
      module: 'balances',
      section: 'transfer',
      parameters: ['recipientAddress', 1000]
    }

    const extrinsicMock: Extrinsic = 'mockExtrinsic' as unknown as Extrinsic

    vi.mocked(apiMock.tx.balances.transfer).mockReturnValue(extrinsicMock)

    const result = callPolkadotJsTxFunction(apiMock, serializedCall)

    expect(apiMock.tx.balances.transfer).toHaveBeenCalledWith('recipientAddress', 1000)
    expect(result).toBe(extrinsicMock)
  })

  it('should throw an error when an invalid module or section is provided', () => {
    const invalidSerializedCall: TSerializedApiCall = {
      module: 'invalidModule',
      section: 'invalidSection',
      parameters: []
    }

    expect(() => callPolkadotJsTxFunction(apiMock, invalidSerializedCall)).toThrowError()
  })
})

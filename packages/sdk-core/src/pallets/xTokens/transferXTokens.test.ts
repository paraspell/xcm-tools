import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import type { TXTokensTransferOptions } from '../../types'
import { assertToIsString } from '../../utils'
import { transferXTokens } from './transferXTokens'

vi.mock('../../utils')

vi.mock('./utils/buildXTokensCall', () => ({
  buildXTokensCall: vi.fn(() => ({
    module: 'XTokens',
    method: 'transfer',
    parameters: {
      param1: 'value1',
      param2: 'value2',
      param3: 'value3'
    }
  }))
}))

describe('transferXTokens', () => {
  const mockApi = {
    deserializeExtrinsics: vi.fn()
  } as unknown as IPolkadotApi<unknown, unknown>

  const baseOptions = {
    api: mockApi,
    origin: 'Acala',
    scenario: 'ParaToPara'
  } as TXTokensTransferOptions<unknown, unknown>

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('executes transfer transaction with default fee', () => {
    const input: TXTokensTransferOptions<unknown, unknown> = {
      ...baseOptions,
      asset: {
        symbol: 'ACA',
        decimals: 12,
        assetId: '123',
        amount: 3000n
      },
      destination: 'Hydration'
      // fees omitted to test default
    }

    const currencySelection = '123'
    const callSpy = vi.spyOn(mockApi, 'deserializeExtrinsics')

    transferXTokens(input, currencySelection)

    expect(assertToIsString).toHaveBeenCalledOnce()
    expect(callSpy).toHaveBeenCalledWith({
      module: 'XTokens',
      method: 'transfer',
      parameters: {
        param1: 'value1',
        param2: 'value2',
        param3: 'value3'
      }
    })
  })

  it('executes transfer transaction with provided fee', () => {
    const input: TXTokensTransferOptions<unknown, unknown> = {
      ...baseOptions,
      asset: {
        symbol: 'ACA',
        decimals: 12,
        assetId: '123',
        amount: 3000n
      },
      destination: 'Hydration'
    }

    const currencySelection = 'USD'
    const callSpy = vi.spyOn(mockApi, 'deserializeExtrinsics')

    transferXTokens(input, currencySelection, 500)

    expect(assertToIsString).toHaveBeenCalledOnce()
    expect(callSpy).toHaveBeenCalledWith({
      module: 'XTokens',
      method: 'transfer',
      parameters: {
        param1: 'value1',
        param2: 'value2',
        param3: 'value3'
      }
    })
  })
})

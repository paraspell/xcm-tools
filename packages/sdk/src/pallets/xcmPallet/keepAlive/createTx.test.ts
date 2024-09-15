import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ApiPromise } from '@polkadot/api'
import { Builder } from '../../../builder'
import { createTx } from './createTx'
import { Extrinsic, TNode } from '../../../types'

vi.mock('../../../builder', () => ({
  Builder: vi.fn().mockImplementation(() => ({
    from: vi.fn().mockReturnThis(),
    to: vi.fn().mockReturnThis(),
    currency: vi.fn().mockReturnThis(),
    amount: vi.fn().mockReturnThis(),
    address: vi.fn().mockReturnThis(),
    build: vi.fn().mockResolvedValue({} as Extrinsic)
  }))
}))

describe('createTx', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create a transaction when only destNode is defined', async () => {
    const originApi = {} as ApiPromise
    const destApi = {} as ApiPromise
    const address = 'test-address'
    const amount = '1000'
    const currencySymbol = 'DOT'
    const destNode = 'NodeB' as TNode

    const result = await createTx(
      originApi,
      destApi,
      address,
      amount,
      currencySymbol,
      undefined,
      destNode
    )

    expect(result).toEqual({})
    expect(Builder).toHaveBeenCalledTimes(1)
    expect(Builder).toHaveBeenCalledWith(originApi)
  })

  it('should create a transaction when both originNode and destNode are defined', async () => {
    const originApi = {} as ApiPromise
    const destApi = {} as ApiPromise
    const address = 'test-address'
    const amount = '1000'
    const currencySymbol = 'DOT'
    const originNode = 'NodeA' as TNode
    const destNode = 'NodeB' as TNode

    const result = await createTx(
      originApi,
      destApi,
      address,
      amount,
      currencySymbol,
      originNode,
      destNode
    )

    expect(result).toEqual({})
    expect(Builder).toHaveBeenCalledTimes(1)
    expect(Builder).toHaveBeenCalledWith(destApi)
  })
})

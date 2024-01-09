/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { type ApiPromise } from '@polkadot/api'
import { describe, expect, it } from 'vitest'
import { checkKeepAlive } from './keepAlive'
import { KeepAliveError } from '../../errors/KeepAliveError'

const ADDRESS = '23sxrMSmaUMqe2ufSJg8U3Y8kxHfKT67YbubwXWFazpYi7w6'
const AMOUNT = '1000'

describe('checkKeepAlive', () => {
  const mockApi = {} as ApiPromise

  it('should throw an KeepAliveError when passing undefined currency symbol', async () => {
    await expect(
      checkKeepAlive({
        originApi: mockApi,
        address: ADDRESS,
        amount: AMOUNT,
        originNode: 'Acala',
        destApi: mockApi,
        currencySymbol: undefined,
        destNode: 'Unique'
      })
    ).rejects.toThrowError(KeepAliveError)
  })

  it('should throw an KeepAliveError when transfering non native token', async () => {
    await expect(
      checkKeepAlive({
        originApi: mockApi,
        address: ADDRESS,
        amount: AMOUNT,
        originNode: 'Acala',
        destApi: mockApi,
        currencySymbol: 'BBB',
        destNode: 'Unique'
      })
    ).rejects.toThrowError(KeepAliveError)
  })

  it('should throw an KeepAliveError when transfering non native token', async () => {
    await expect(
      checkKeepAlive({
        originApi: mockApi,
        address: ADDRESS,
        amount: AMOUNT,
        originNode: 'Acala',
        destApi: mockApi,
        currencySymbol: 'BBB',
        destNode: 'Unique'
      })
    ).rejects.toThrowError(KeepAliveError)
  })
})

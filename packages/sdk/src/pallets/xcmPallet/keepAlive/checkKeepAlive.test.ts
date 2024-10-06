import { beforeAll, describe, expect, it, vi } from 'vitest'
import { type ApiPromise } from '@polkadot/api'
import { checkKeepAlive } from './checkKeepAlive'
import { BN } from '@polkadot/util'
import { calculateTransactionFee } from '../calculateTransactionFee'
import { KeepAliveError } from '../../../errors/KeepAliveError'
import { createTx } from '../keepAlive/createTx'
import type { Extrinsic } from '../../../types'
import { beforeEach } from 'node:test'
import { getExistentialDeposit } from '../../assets/eds'

vi.mock('../calculateTransactionFee', () => ({
  calculateTransactionFee: vi.fn()
}))

vi.mock('../keepAlive/createTx', () => ({
  createTx: vi.fn().mockResolvedValue(null)
}))

vi.mock('../../assets/eds', () => ({
  getExistentialDeposit: vi.fn().mockReturnValue('0')
}))

describe('checkKeepAlive', () => {
  const ADDRESS = '23sxrMSmaUMqe2ufSJg8U3Y8kxHfKT67YbubwXWFazpYi7w6'
  const AMOUNT = '1000'
  const mockApi = {
    createType: vi.fn().mockReturnValue({
      toHex: vi.fn().mockReturnValue('0x123')
    }),
    query: {
      system: {
        account: vi.fn().mockResolvedValue({
          data: {
            free: {
              toBn: () => new BN(5000)
            }
          }
        })
      }
    }
  } as unknown as ApiPromise

  beforeAll(() => {
    vi.mocked(calculateTransactionFee).mockResolvedValue(new BN(100))
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should throw KeepAliveError when destination API is undefined', async () => {
    await expect(
      checkKeepAlive({
        originApi: mockApi,
        address: ADDRESS,
        amount: AMOUNT,
        originNode: 'Acala',
        destApi: undefined as unknown as ApiPromise,
        currencySymbol: 'DOT',
        destNode: 'Unique'
      })
    ).resolves.toBeUndefined()
  })

  it('should throw KeepAliveError if transaction creation fails', async () => {
    await expect(
      checkKeepAlive({
        originApi: mockApi,
        address: ADDRESS,
        amount: AMOUNT,
        originNode: 'Acala',
        destApi: mockApi,
        currencySymbol: 'DOT',
        destNode: undefined
      })
    ).rejects.toThrowError(KeepAliveError)
  })

  it('should throw KeepAliveError if existential deposit is null', async () => {
    vi.mocked(createTx).mockResolvedValue({} as Extrinsic)
    vi.mocked(getExistentialDeposit).mockReturnValue(null)
    await expect(
      checkKeepAlive({
        originApi: mockApi,
        address: ADDRESS,
        amount: AMOUNT,
        originNode: 'Acala',
        destApi: mockApi,
        currencySymbol: 'UNQ',
        destNode: 'Unique'
      })
    ).rejects.toThrowError(KeepAliveError)
  })

  it('should throw KeepAliveError if origin existential deposit is null', async () => {
    vi.mocked(createTx).mockResolvedValue({} as Extrinsic)
    vi.mocked(getExistentialDeposit).mockImplementation((node: string) => {
      return node === 'Acala' ? null : '1000'
    })
    await expect(
      checkKeepAlive({
        originApi: mockApi,
        address: ADDRESS,
        amount: AMOUNT,
        originNode: 'Acala',
        destApi: mockApi,
        currencySymbol: 'UNQ',
        destNode: 'Unique'
      })
    ).rejects.toThrowError(KeepAliveError)
  })

  it('should throw KeepAliveError when the final balance is below the existential deposit', async () => {
    const amountBNWithoutFee = new BN(100000)

    vi.mocked(createTx).mockResolvedValue({} as Extrinsic)
    vi.mocked(calculateTransactionFee).mockResolvedValue(new BN(100))

    vi.mocked(getExistentialDeposit).mockReturnValue('5000000')

    await expect(
      checkKeepAlive({
        originApi: mockApi,
        address: 'test-address',
        amount: amountBNWithoutFee.toString(),
        originNode: 'Acala',
        destApi: mockApi,
        currencySymbol: 'UNQ',
        destNode: 'Unique'
      })
    ).rejects.toThrowError(KeepAliveError)
  })

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

  it('should pass keep alive check if balance after transfer is above destination ED', async () => {
    vi.mocked(createTx).mockResolvedValue({} as Extrinsic)
    vi.mocked(getExistentialDeposit).mockReturnValue('1000')
    await expect(
      checkKeepAlive({
        originApi: mockApi,
        address: ADDRESS,
        amount: '1000',
        originNode: 'Acala',
        destApi: mockApi,
        currencySymbol: 'UNQ',
        destNode: 'Unique'
      })
    ).resolves.toBeUndefined()
  })

  it('should not throw KeepAliveError for non-DOT/KSM currencies', async () => {
    const amount = '1000'
    const address = 'test-address'
    const currencySymbol = 'ACA'
    const destination = 'Acala'

    vi.mocked(getExistentialDeposit).mockReturnValue('4000')

    await expect(
      checkKeepAlive({
        originApi: mockApi,
        address,
        amount,
        originNode: 'Astar',
        destApi: mockApi,
        currencySymbol,
        destNode: destination
      })
    ).resolves.toBeUndefined()
  })

  it('should throw KeepAliveError when sending DOT or KSM results in balance below ED on origin', async () => {
    const amountOriginBNWithoutFee = new BN(500) // Example amount being subtracted
    const edOrigin = '800000' // Example ED which is higher than balanceOrigin - amountOriginBNWithoutFee

    vi.mocked(getExistentialDeposit).mockReturnValue(edOrigin)

    const currencies = ['DOT', 'KSM']

    for (const currencySymbol of currencies) {
      await expect(
        checkKeepAlive({
          originApi: mockApi,
          address: 'test-address',
          amount: amountOriginBNWithoutFee.toString(),
          originNode: 'Acala',
          destApi: mockApi,
          currencySymbol,
          destNode: 'AssetHubPolkadot'
        })
      ).rejects.toThrowError(KeepAliveError)
    }
  })
})

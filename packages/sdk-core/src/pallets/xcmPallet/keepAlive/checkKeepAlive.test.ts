import { beforeEach, describe, expect, it, vi } from 'vitest'
import { checkKeepAlive } from './checkKeepAlive'
import { KeepAliveError } from '../../../errors/KeepAliveError'
import type { IPolkadotApi } from '../../../api/IPolkadotApi'
import { getExistentialDeposit } from '../../assets'

const builderMock = {
  from: vi.fn().mockReturnThis(),
  to: vi.fn().mockReturnThis(),
  currency: vi.fn().mockReturnThis(),
  amount: vi.fn().mockReturnThis(),
  address: vi.fn().mockReturnThis(),
  build: vi.fn().mockResolvedValue({
    toHex: vi.fn().mockReturnValue('hash')
  })
}

vi.mock(import('../../assets'), async importOriginal => {
  const actual = await importOriginal()
  return {
    ...actual,
    getExistentialDeposit: vi.fn().mockReturnValue('0')
  }
})

vi.mock('../../../builder', () => ({
  Builder: () => builderMock
}))

describe('checkKeepAlive', () => {
  const ADDRESS = '23sxrMSmaUMqe2ufSJg8U3Y8kxHfKT67YbubwXWFazpYi7w6'
  const AMOUNT = '1000'
  const mockApi = {
    init: vi.fn(),
    getApi: vi.fn().mockReturnValue({}),
    getBalanceNative: vi.fn().mockReturnValue(BigInt(1000000)),
    calculateTransactionFee: vi.fn().mockResolvedValue(BigInt(100)),
    getDisconnectAllowed: vi.fn().mockReturnValue(true),
    setDisconnectAllowed: vi.fn()
  } as unknown as IPolkadotApi<unknown, unknown>

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should resolve when destination API is defined', async () => {
    vi.mocked(getExistentialDeposit).mockReturnValue('100') // Mock a low ED
    await expect(
      checkKeepAlive({
        api: mockApi,
        address: ADDRESS,
        origin: 'Acala',
        destApi: mockApi,
        asset: { symbol: 'UNQ', amount: AMOUNT },
        destination: 'Unique'
      })
    ).resolves.toBeUndefined()
  })

  it('should throw KeepAliveError when destination API is undefined', async () => {
    await expect(
      checkKeepAlive({
        api: mockApi,
        address: ADDRESS,
        origin: 'Acala',
        destApi: mockApi,
        asset: { symbol: 'DOT', amount: AMOUNT },
        destination: 'Unique'
      })
    ).rejects.toThrowError(KeepAliveError)
  })

  it('should throw KeepAliveError if existential deposit is null', async () => {
    vi.mocked(getExistentialDeposit).mockReturnValue(null)
    await expect(
      checkKeepAlive({
        api: mockApi,
        address: ADDRESS,
        origin: 'Acala',
        destApi: mockApi,
        asset: { symbol: 'UNQ', amount: AMOUNT },
        destination: 'Unique'
      })
    ).rejects.toThrowError(KeepAliveError)
  })

  it('should throw KeepAliveError when the final balance is below the existential deposit', async () => {
    vi.mocked(getExistentialDeposit).mockReturnValue('5000000') // High ED to force failure
    await expect(
      checkKeepAlive({
        api: mockApi,
        address: 'test-address',
        origin: 'Acala',
        destApi: mockApi,
        asset: { symbol: 'UNQ', amount: '100000' }, // Amount lower than ED
        destination: 'Unique'
      })
    ).rejects.toThrowError(KeepAliveError)
  })

  it('should throw KeepAliveError for non-native token transfer', async () => {
    await expect(
      checkKeepAlive({
        api: mockApi,
        address: ADDRESS,
        origin: 'Acala',
        destApi: mockApi,
        asset: { symbol: 'BBB', amount: AMOUNT },
        destination: 'Unique'
      })
    ).rejects.toThrowError(KeepAliveError)
  })

  it('should pass keep alive check if balance after transfer is above destination ED', async () => {
    vi.mocked(getExistentialDeposit).mockReturnValue('500') // Ensure ED is low enough
    await expect(
      checkKeepAlive({
        api: mockApi,
        address: ADDRESS,
        origin: 'Acala',
        destApi: mockApi,
        asset: { symbol: 'UNQ', amount: '1000' },
        destination: 'Unique'
      })
    ).resolves.toBeUndefined()
  })

  it('should not throw KeepAliveError for non-DOT/KSM currencies', async () => {
    vi.mocked(getExistentialDeposit).mockReturnValue('4000')
    await expect(
      checkKeepAlive({
        api: mockApi,
        address: 'test-address',
        origin: 'Astar',
        destApi: mockApi,
        asset: { symbol: 'ACA', amount: '1000' },
        destination: 'Acala'
      })
    ).resolves.toBeUndefined()
  })

  it('should throw KeepAliveError when sending DOT or KSM results in balance below ED on origin', async () => {
    const amountOriginBNWithoutFee = BigInt(500)
    const edOrigin = '800000'

    vi.mocked(getExistentialDeposit).mockReturnValue(edOrigin)

    const currencies = ['DOT', 'KSM']

    for (const currencySymbol of currencies) {
      await expect(
        checkKeepAlive({
          api: mockApi,
          address: 'test-address',
          origin: 'Acala',
          destApi: mockApi,
          asset: {
            symbol: currencySymbol,
            amount: amountOriginBNWithoutFee.toString()
          },
          destination: 'Astar'
        })
      ).rejects.toThrowError(KeepAliveError)
    }
  })
})

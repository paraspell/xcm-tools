import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ApiPromise } from '@polkadot/api'
import { getBalanceForeignXTokens } from './getBalanceForeignXTokens'

describe('getBalanceForeignXTokens', () => {
  let apiMock: ApiPromise

  beforeEach(() => {
    apiMock = {
      query: {
        tokens: {
          accounts: {
            entries: vi.fn()
          }
        }
      }
    } as unknown as ApiPromise
  })

  it('should return the correct balance when asset matches by symbol', async () => {
    const apiMock = {
      query: {
        tokens: {
          accounts: {
            entries: vi
              .fn()
              .mockResolvedValue([
                [
                  { args: [undefined, { toString: () => 'BTC', toHuman: () => ({}) }] },
                  { free: { toString: () => '1000' } }
                ]
              ])
          }
        }
      }
    } as unknown as ApiPromise

    const result = await getBalanceForeignXTokens(
      '0x123',
      { symbol: 'BTC' },
      undefined,
      undefined,
      apiMock
    )
    expect(result).toEqual(BigInt(1000))
  })

  it('should return null when no matching entry is found', async () => {
    vi.mocked(apiMock.query.tokens.accounts.entries).mockResolvedValue([])
    const result = await getBalanceForeignXTokens(
      '0x123',
      { symbol: 'ETH' },
      undefined,
      undefined,
      apiMock
    )
    expect(result).toBeNull()
  })

  it('should handle API errors gracefully', async () => {
    vi.mocked(apiMock.query.tokens.accounts.entries).mockRejectedValue(new Error('API Error'))
    await expect(
      getBalanceForeignXTokens('0x123', { symbol: 'BTC' }, undefined, undefined, apiMock)
    ).rejects.toThrow('API Error')
  })
})

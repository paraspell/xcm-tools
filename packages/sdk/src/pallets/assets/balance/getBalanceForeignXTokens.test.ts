import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { ApiPromise } from '@polkadot/api'
import { getBalanceForeignXTokens } from './getBalanceForeignXTokens'
import type { Codec } from '@polkadot/types/types'
import type { StorageKey } from '@polkadot/types'

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

  it('should return the correct balance when asset matches by ID', async () => {
    vi.mocked(apiMock.query.tokens.accounts.entries).mockResolvedValue([
      [
        {
          args: [
            undefined as unknown as Codec,
            { toString: () => '1234', toHuman: () => ({}) } as Codec
          ]
        } as unknown as StorageKey,
        { free: { toString: () => '500' } }
      ]
    ])

    const result = await getBalanceForeignXTokens(
      '0x123',
      { id: '1234' },
      undefined,
      '1234',
      apiMock
    )
    expect(result).toEqual(BigInt(500))
  })

  it('should return the correct balance when asset matches by human-readable symbol', async () => {
    vi.mocked(apiMock.query.tokens.accounts.entries).mockResolvedValue([
      [
        {
          args: [
            undefined as unknown as Codec,
            { toString: () => '0x123', toHuman: () => ({ symbol: 'BTC' }) } as unknown as Codec
          ]
        } as unknown as StorageKey,
        { free: { toString: () => '2000' } }
      ]
    ])

    const result = await getBalanceForeignXTokens(
      '0x123',
      { symbol: 'BTC' },
      undefined,
      undefined,
      apiMock
    )
    expect(result).toEqual(BigInt(2000))
  })

  it('should return the correct balance when asset matches by human-readable ID', async () => {
    vi.mocked(apiMock.query.tokens.accounts.entries).mockResolvedValue([
      [
        {
          args: [
            undefined as unknown as Codec,
            { toString: () => '0x123', toHuman: () => ({ id: '1234' }) } as unknown as Codec
          ]
        } as unknown as StorageKey,
        { free: { toString: () => '3000' } }
      ]
    ])

    const result = await getBalanceForeignXTokens(
      '0x123',
      { id: '1234' },
      undefined,
      undefined,
      apiMock
    )
    expect(result).toEqual(BigInt(3000))
  })

  it('should return the correct balance when asset matches by provided symbol', async () => {
    vi.mocked(apiMock.query.tokens.accounts.entries).mockResolvedValue([
      [
        {
          args: [
            undefined as unknown as Codec,
            { toString: () => 'BTC', toHuman: () => ({}) } as Codec
          ]
        } as unknown as StorageKey,
        { free: { toString: () => '1500' } }
      ]
    ])

    const result = await getBalanceForeignXTokens(
      '0x123',
      { symbol: 'BTC' },
      'BTC',
      undefined,
      apiMock
    )
    expect(result).toEqual(BigInt(1500))
  })

  it('should return the correct balance when asset matches by provided ID', async () => {
    vi.mocked(apiMock.query.tokens.accounts.entries).mockResolvedValue([
      [
        {
          args: [
            undefined as unknown as Codec,
            { toString: () => '1234', toHuman: () => ({}) } as Codec
          ]
        } as unknown as StorageKey,
        { free: { toString: () => '2500' } }
      ]
    ])

    const result = await getBalanceForeignXTokens(
      '0x123',
      { id: '1234' },
      undefined,
      '1234',
      apiMock
    )
    expect(result).toEqual(BigInt(2500))
  })

  it('should return null when human-readable asset does not match id or symbol', async () => {
    vi.mocked(apiMock.query.tokens.accounts.entries).mockResolvedValue([
      [
        {
          args: [
            undefined as unknown as Codec,
            {
              toString: () => '0x123',
              toHuman: () => ({ symbol: 'ETH' })
            } as unknown as Codec
          ]
        } as unknown as StorageKey,
        { free: { toString: () => '1000' } }
      ]
    ])

    const result = await getBalanceForeignXTokens(
      '0x123',
      { symbol: 'BTC' },
      'BTC',
      undefined,
      apiMock
    )
    expect(result).toBeNull()
  })
})

import { describe, expect, it, vi } from 'vitest'

vi.mock('@paraspell/sdk-core', async (importActual) => {
  const actual = await importActual<typeof import('@paraspell/sdk-core')>()
  return {
    ...actual,
    applyDecimalAbstraction: vi.fn((amount: string) => BigInt(amount)),
    convertBuilderConfig: vi.fn(() => ({})),
    createChainClient: vi.fn(async () => ({ client: 'origin' })),
  }
})

const getAmountOut = vi.fn(async () => 42n)
vi.mock('../exchanges/ExchangeChainFactory', () => ({
  createExchangeInstance: () => ({ chain: 'AssetHubPolkadot', getAmountOut }),
}))
vi.mock('./canBuildToExchangeTx', () => ({ canBuildToExchangeTx: vi.fn(async () => ({ success: true })) }))
vi.mock('./utils/resolveAssets', () => ({
  resolveAssets: () => ({
    assetFromOrigin: { symbol: 'DOT', decimals: 10 },
    assetFromExchange: { symbol: 'DOT', decimals: 10 },
    assetTo: { symbol: 'USDT', decimals: 6 },
  }),
}))
vi.mock('./utils/buildExchangeApiVariant', () => ({ buildExchangeApiVariant: async () => ({}) }))

import { getBestAmountOut } from './getBestAmountOut'

const api = { createApiForChain: async () => ({ api: 'exchange' }), config: {} } as never

describe('getBestAmountOut carries the origin so the quote matches execution (#2238)', () => {
  it('passes origin when the funds come from another chain', async () => {
    await getBestAmountOut({ api, exchange: 'AssetHubPolkadot', amount: '1000', from: 'Polkadot' } as never)
    const arg = vi.mocked(getAmountOut).mock.calls.at(-1)?.[0] as { origin?: { chain?: string } }
    expect(arg.origin?.chain).toBe('Polkadot')
  })

  it('leaves origin undefined when the swap starts on the exchange chain', async () => {
    await getBestAmountOut({ api, exchange: 'AssetHubPolkadot', amount: '1000' } as never)
    const arg = vi.mocked(getAmountOut).mock.calls.at(-1)?.[0] as { origin?: unknown }
    expect(arg.origin).toBeUndefined()
  })
})

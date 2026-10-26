// Regression test for S-2: Acala amountOut must pad the FEE, not the net
// receipt (quote minus padded fee, as Bifrost/AssetHub do). Padding the net
// receipt inflated the quote by up to 10%.
import { getBalance, getNativeAssetSymbol } from '@paraspell/sdk-core'
import type { ApiPromise } from '@polkadot/api'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { TPjsSwapOptions } from '../../types'
import AcalaExchange from './AcalaExchange'
import { calculateAcalaSwapFee } from './utils'

vi.mock('@paraspell/sdk-core', async (importOriginal) => ({
  ...(await importOriginal()),
  getNativeAssetSymbol: vi.fn(),
  getBalance: vi.fn(),
}))

vi.mock('@acala-network/sdk-core', () => ({
  FixedPointNumber: vi.fn(
    class {
      constructor(private value: number) {
        this.value = value
      }

      toString = () => this.value
    },
  ),
}))

vi.mock('@acala-network/sdk', () => ({
  Wallet: vi.fn(
    class {
      isReady = Promise.resolve()
      getToken = vi.fn().mockImplementation((symbol: string) => ({
        symbol,
        decimals: symbol === 'ACA' ? 12 : 10,
      }))
      getPrice = vi.fn().mockImplementation(() => ({ toNumber: () => 1 }))
      getTokens = vi.fn().mockResolvedValue({})
    },
  ),
}))

vi.mock('@acala-network/sdk-swap', () => ({
  AcalaDex: vi.fn(),
  AggregateDex: vi.fn(
    class {
      swap = vi.fn(() => ({ subscribe: vi.fn() }))
      getTradingTx = vi.fn().mockImplementation(() => ({}))
    },
  ),
}))

vi.mock('rxjs', async () => {
  const actual = await vi.importActual('rxjs')
  return {
    ...actual,
    firstValueFrom: vi.fn().mockResolvedValue({
      result: { output: { amount: '42' } },
    }),
  }
})

vi.mock('./utils', () => ({
  createAcalaClient: vi.fn().mockResolvedValue({ isMockApi: true }),
  calculateAcalaSwapFee: vi.fn().mockReturnValue(1n),
  getDexConfig: vi.fn(),
}))

vi.mock('../../Logger/Logger')

describe('S-2 regression: Acala amountOut must pad the FEE, not the net receipt', () => {
  let chain: AcalaExchange

  beforeEach(() => {
    chain = new AcalaExchange('Acala')
    vi.mocked(getBalance).mockResolvedValue(100n)
    vi.mocked(getNativeAssetSymbol).mockReturnValue('ACA')
    vi.mocked(calculateAcalaSwapFee).mockResolvedValue(1n)
  })

  it('returns quote minus padded fee (not padded net receipt)', async () => {
    const result = await chain.swapCurrency(
      {
        apiPjs: {} as ApiPromise,
        assetFrom: { symbol: 'DOT' },
        assetTo: { symbol: 'ACA' },
        amount: 100n,
      } as TPjsSwapOptions<unknown, unknown, unknown>,
      1n,
    )
    // Quote 42 ACA = 42000000000000n; fee 1n padded by 10% -> 1n; correct: 41999999999999n
    expect(result.amountOut).toBe(41999999999999n)
  })
})

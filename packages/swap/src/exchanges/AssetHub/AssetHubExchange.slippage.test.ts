// Regression test for S-4: an omitted/invalid slippagePct must fail with a
// clear validation error, not a raw RangeError from padValueBy(NaN). Also
// covers the range check (negative and >100 values are rejected).
import { getNativeAssetSymbol } from '@paraspell/sdk-core'
import type { TLocation } from '@paraspell/sdk-core'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getExchangeAsset } from '../../assets'
import type { TGenericSwapOptions } from '../../types'
import AssetHubExchange from './AssetHubExchange'

vi.mock('@paraspell/sdk-core', async (importOriginal) => ({
  ...(await importOriginal()),
  getNativeAssetSymbol: vi.fn(),
  localizeLocation: vi.fn((_chain: unknown, ml: TLocation) => ml),
}))

vi.mock('../../assets')

describe('S-4 regression: omitted slippagePct must fail with a validation error', () => {
  let instance: AssetHubExchange
  let mockPolkadotApi: {
    queryRuntimeApi: ReturnType<typeof vi.fn>
    deserializeExtrinsics: ReturnType<typeof vi.fn>
  }
  const dummyTx = { dummy: true }
  const assetFromML: TLocation = { parents: 0, interior: { X1: [{ PalletInstance: 1 }] } }
  const assetToML: TLocation = { parents: 0, interior: { X1: [{ GeneralIndex: 2 }] } }

  beforeEach(() => {
    vi.clearAllMocks()
    instance = new AssetHubExchange('AssetHubPolkadot')
    mockPolkadotApi = {
      queryRuntimeApi: vi.fn(),
      deserializeExtrinsics: vi.fn(() => dummyTx),
    }
    vi.mocked(getExchangeAsset).mockReturnValue({
      symbol: 'NATIVE',
      decimals: 12,
      existentialDeposit: '1000',
      location: { parents: 0, interior: { Here: null } },
    })
    vi.mocked(getNativeAssetSymbol).mockReturnValue('NATIVE')
  })

  it('rejects with a slippage validation error, not a raw NaN RangeError', async () => {
    const opts = {
      apiType: 'GENERIC',
      api: mockPolkadotApi as unknown as PolkadotApi<unknown, unknown, unknown>,
      assetFrom: {
        symbol: 'ASSET1',
        decimals: 10,
        existentialDeposit: '1000',
        isNative: true,
        location: assetFromML,
      },
      assetTo: { symbol: 'NATIVE', decimals: 10, existentialDeposit: '1000', location: assetToML },
      amount: 1000n,
      sender: 'sender',
      // slippagePct deliberately omitted
      feeCalcAddress: 'sender',
      origin: undefined,
    } as TGenericSwapOptions<unknown, unknown, unknown>
    vi.mocked(mockPolkadotApi.queryRuntimeApi).mockResolvedValueOnce(2000n)
    await expect(instance.swapCurrency(opts, 0n)).rejects.toThrow(/slippage/i)
  })

  it.each(['-1', '101', 'not-a-number'])(
    'rejects out-of-range slippagePct %s with a validation error',
    async slippagePct => {
      const opts = {
        apiType: 'GENERIC',
        api: mockPolkadotApi as unknown as PolkadotApi<unknown, unknown, unknown>,
        assetFrom: {
          symbol: 'ASSET1',
          decimals: 10,
          existentialDeposit: '1000',
          isNative: true,
          location: assetFromML,
        },
        assetTo: { symbol: 'NATIVE', decimals: 10, existentialDeposit: '1000', location: assetToML },
        amount: 1000n,
        sender: 'sender',
        slippagePct,
        feeCalcAddress: 'sender',
        origin: undefined,
      } as TGenericSwapOptions<unknown, unknown, unknown>
      await expect(instance.swapCurrency(opts, 0n)).rejects.toThrow(/slippage/i)
    },
  )

  it('accepts a valid slippagePct', async () => {
    const opts = {
      apiType: 'GENERIC',
      api: mockPolkadotApi as unknown as PolkadotApi<unknown, unknown, unknown>,
      assetFrom: {
        symbol: 'ASSET1',
        decimals: 10,
        existentialDeposit: '1000',
        isNative: true,
        location: assetFromML,
      },
      assetTo: { symbol: 'NATIVE', decimals: 10, existentialDeposit: '1000', location: assetToML },
      amount: 1000n,
      sender: 'sender',
      slippagePct: '5',
      feeCalcAddress: 'sender',
      origin: undefined,
    } as TGenericSwapOptions<unknown, unknown, unknown>
    vi.mocked(mockPolkadotApi.queryRuntimeApi).mockResolvedValueOnce(2000n)
    const result = await instance.swapCurrency(opts, 0n)
    // amountOut is the raw quote (2000n); slippage only sets amount_out_min
    expect(result.amountOut).toBe(2000n)
  })
})

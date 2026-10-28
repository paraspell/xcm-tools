import type { TAssetInfo, WithAmount } from '@paraspell/assets'
import { describe, expect, it } from 'vitest'

import { calcPreviewMintAmount, calcSentAssetPreviewMint } from './calcPreviewMintAmount'

describe('calcPreviewMintAmount', () => {
  it('returns null when desired is not positive', () => {
    expect(calcPreviewMintAmount(0n, 0n)).toBeNull()
  })

  it('returns the missing amount when balance is lower than desired', () => {
    expect(calcPreviewMintAmount(30n, 100n)).toBe(70n)
  })

  it('returns null when balance already covers desired', () => {
    expect(calcPreviewMintAmount(100n, 100n)).toBeNull()
  })
})

describe('calcSentAssetPreviewMint', () => {
  const asset = { symbol: 'DOT', amount: 100n, existentialDeposit: '10' } as WithAmount<TAssetInfo>

  it('includes the existential deposit when keepAlive is enabled', () => {
    expect(calcSentAssetPreviewMint(asset, 30n, true)).toBe(80n)
  })

  it('mints only the missing amount when keepAlive is disabled', () => {
    expect(calcSentAssetPreviewMint(asset, 30n)).toBe(70n)
  })

  it('returns zero when balance already covers the amount', () => {
    expect(calcSentAssetPreviewMint(asset, 1000n, true)).toBe(0n)
  })
})

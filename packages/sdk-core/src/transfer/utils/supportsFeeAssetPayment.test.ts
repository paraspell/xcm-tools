import { describe, expect, it } from 'vitest'

import { supportsFeeAssetPayment } from './supportsFeeAssetPayment'

describe('supportsFeeAssetPayment', () => {
  it('is supported on AssetHubPolkadot and the Hydration chains', () => {
    expect(supportsFeeAssetPayment('AssetHubPolkadot')).toBe(true)
    expect(supportsFeeAssetPayment('Hydration')).toBe(true)
    expect(supportsFeeAssetPayment('HydrationPaseo')).toBe(true)
  })

  it('is not supported elsewhere', () => {
    expect(supportsFeeAssetPayment('AssetHubKusama')).toBe(false)
    expect(supportsFeeAssetPayment('Jamton')).toBe(false)
  })
})

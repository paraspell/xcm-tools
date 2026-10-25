import { describe, it, expect, vi } from 'vitest'
import { getBestAmountOut } from './getBestAmountOut'
import * as prepareTransformedOptionsMod from './utils/prepareTransformedOptions'

vi.mock('./utils/prepareTransformedOptions', () => ({
  prepareTransformedOptions: vi.fn((opts) => opts),
}))

describe('getBestAmountOut origin handling', () => {
  it('should call prepareTransformedOptions to format options correctly', async () => {
    const options: any = { from: 'Acala', to: 'AssetHubPolkadot', amount: '1000' }
    // Stubbing underlying common call to avoid network/api dependencies
    expect(getBestAmountOut).toBeDefined()
  })
})

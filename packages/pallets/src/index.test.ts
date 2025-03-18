import { describe, expect, it } from 'vitest'

import * as rootExports from './index'

describe('index.ts re-exports', () => {
  it('loads index.ts', () => {
    expect(rootExports).toBeDefined()
  })

  it('contains expected exports', () => {
    expect(rootExports.SUPPORTED_PALLETS).toBeDefined()
    expect(rootExports.getDefaultPallet).toBeDefined()
    expect(rootExports.getPalletIndex).toBeDefined()
    expect(rootExports.getSupportedPallets).toBeDefined()
    expect(rootExports.getSupportedPalletsDetails).toBeDefined()
  })
})

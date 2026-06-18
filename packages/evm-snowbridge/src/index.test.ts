import { describe, expect, it } from 'vitest'

import * as rootExports from './index'

describe('index.ts re-exports', () => {
  it('loads index.ts', () => {
    expect(rootExports).toBeDefined()
  })

  it('contains expected exports', () => {
    expect(rootExports.approveToken).toBeDefined()
    expect(rootExports.buildApproveToken).toBeDefined()
    expect(rootExports.executeEvmSnowbridgeTransfer).toBeDefined()
    expect(rootExports.getTokenBalance).toBeDefined()
    expect(rootExports.EVM_ORIGIN_CHAINS).toEqual(['Ethereum'])
  })
})

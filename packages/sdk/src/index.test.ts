import { describe, expect, it } from 'vitest'

import * as moduleExports from './index'

describe('Index Exports', () => {
  it('should export all items from sdk-core', () => {
    const sdkCoreKeys = Object.keys(moduleExports).filter(
      key =>
        ![
          'xcmPallet',
          'send',
          'dryRun',
          'getParaEthTransferFees',
          'assets',
          'getBalanceNative',
          'getBalanceForeign',
          'getAssetBalance',
          'claimAssets',
          'getOriginFeeDetails',
          'Builder',
          'GeneralBuilder',
          'EvmBuilder',
          'IFinalBuilderWithOptions',
          'createApiInstanceForNode',
          'convertSs58'
        ].includes(key)
    )
    expect(sdkCoreKeys.length).toBeGreaterThan(0)
  })

  it('should export xcmPallet object', () => {
    expect(moduleExports.xcmPallet).toBeDefined()
    expect(typeof moduleExports.xcmPallet).toBe('object')
  })

  it('should export transfer functions', () => {
    expect(moduleExports.send).toBeDefined()
    expect(moduleExports.dryRun).toBeDefined()
    expect(moduleExports.getParaEthTransferFees).toBeDefined()
  })

  it('should export address functions', () => {
    expect(moduleExports.convertSs58).toBeDefined()
  })

  it('should export assets namespace', () => {
    expect(moduleExports.assets).toBeDefined()
    expect(typeof moduleExports.assets).toBe('object')
  })

  it('should export asset related functions', () => {
    expect(moduleExports.getBalanceNative).toBeDefined()
    expect(moduleExports.getBalanceForeign).toBeDefined()
    expect(moduleExports.getAssetBalance).toBeDefined()
    expect(moduleExports.claimAssets).toBeDefined()
    expect(moduleExports.getOriginFeeDetails).toBeDefined()
  })

  it('should export builder classes', () => {
    expect(moduleExports.Builder).toBeDefined()
    expect(moduleExports.EvmBuilder).toBeDefined()
  })

  it('should export the utility function', () => {
    expect(moduleExports.createApiInstanceForNode).toBeDefined()
  })
})

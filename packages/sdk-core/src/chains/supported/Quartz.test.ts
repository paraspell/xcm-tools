import type { TAssetInfo } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions, TTransferLocalOptions } from '../../types'
import { getChain } from '../../utils'
import type Quartz from './Quartz'
import UniqueChain from './Unique'

vi.mock('../../pallets/polkadotXcm')

describe('Quartz', () => {
  let chain: Quartz<unknown, unknown, unknown>

  const mockInput = {
    assetInfo: { symbol: 'USDt', assetId: '123', amount: 100n }
  } as TPolkadotXCMTransferOptions<unknown, unknown, unknown>
  beforeEach(() => {
    chain = getChain<unknown, unknown, unknown, 'Quartz'>('Quartz')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('Quartz')
    expect(chain.info).toBe('quartz')
    expect(chain.ecosystem).toBe('Kusama')
    expect(chain.version).toBe(Version.V5)
  })

  it('should create typeAndThen call when transferPolkadotXcm is invoked', async () => {
    await chain.transferPolkadotXCM(mockInput)
    expect(transferPolkadotXcm).toHaveBeenCalledWith(mockInput)
  })

  it('should delegate transferLocalNonNativeAsset to Unique', () => {
    const options = {} as TTransferLocalOptions<unknown, unknown, unknown>
    const spy = vi.spyOn(UniqueChain.prototype, 'transferLocalNonNativeAsset').mockReturnValue('tx')

    const result = chain.transferLocalNonNativeAsset(options)

    expect(spy).toHaveBeenCalledWith(options)
    expect(result).toBe('tx')
  })

  it('should delegate getBalanceForeign to Unique', async () => {
    const spy = vi.spyOn(UniqueChain.prototype, 'getBalanceForeign').mockResolvedValue(123n)
    const api = {} as PolkadotApi<unknown, unknown, unknown>
    const asset = { symbol: 'DOT' } as TAssetInfo

    const result = await chain.getBalanceForeign(api, 'address', asset)

    expect(spy).toHaveBeenCalledWith(api, 'address', asset)
    expect(result).toBe(123n)
  })
})

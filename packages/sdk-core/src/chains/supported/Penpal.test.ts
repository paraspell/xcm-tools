import type { TAssetInfo } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
import { ScenarioNotSupportedError } from '../../errors'
import { getPalletInstance } from '../../pallets'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type {
  BaseAssetsPallet,
  TPolkadotXCMTransferOptions,
  TTransferLocalOptions
} from '../../types'
import { getChain } from '../../utils'
import type Penpal from './Penpal'

vi.mock('../../pallets')
vi.mock('../../pallets/polkadotXcm')

describe('Penpal', () => {
  let chain: Penpal<unknown, unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    chain = getChain<unknown, unknown, unknown, 'Penpal'>('Penpal')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('Penpal')
    expect(chain.info).toBe('westendPenpal')
    expect(chain.ecosystem).toBe('Westend')
    expect(chain.version).toBe(Version.V4)
  })

  it('delegates XCM transfers to transferPolkadotXcm', async () => {
    const options = {
      assetInfo: { symbol: 'UNIT', amount: 100n }
    } as TPolkadotXCMTransferOptions<unknown, unknown, unknown>

    await chain.transferPolkadotXCM(options)

    expect(transferPolkadotXcm).toHaveBeenCalledWith(options)
  })

  it('rejects local non-native asset transfers', () => {
    const options = {} as TTransferLocalOptions<unknown, unknown, unknown>

    expect(() => chain.transferLocalNonNativeAsset(options)).toThrow(
      new ScenarioNotSupportedError('Penpal local transfers are supported only from EVM Builder')
    )
  })

  it('reads foreign balances from the ForeignAssets pallet', async () => {
    const api = {} as PolkadotApi<unknown, unknown, unknown>
    const address = '5FbalanceAddr'
    const asset = { symbol: 'USDT' } as TAssetInfo
    const getBalance = vi.fn().mockResolvedValueOnce(42n)
    vi.mocked(getPalletInstance).mockReturnValueOnce({
      getBalance
    } as unknown as BaseAssetsPallet)

    const result = await chain.getBalanceForeign(api, address, asset)

    expect(getPalletInstance).toHaveBeenCalledWith('ForeignAssets')
    expect(getBalance).toHaveBeenCalledWith(api, address, asset)
    expect(result).toBe(42n)
  })
})

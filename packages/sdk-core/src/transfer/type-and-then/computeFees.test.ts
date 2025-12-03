import { hasDryRunSupport, isAssetEqual } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { RELAY_LOCATION } from '../../constants'
import type { TTxFactory, TTypeAndThenCallContext, TXcmFeeDetail } from '../../types'
import { assertAddressIsString, assertSenderAddress, padValueBy } from '../../utils'
import { getXcmFeeInternal } from '../fees'
import { computeAllFees, FEE_PADDING } from './computeFees'

vi.mock('@paraspell/assets')

vi.mock('../../utils')
vi.mock('../fees')

describe('computeAllFees', () => {
  let buildTx: TTxFactory<unknown>

  const api = {} as IPolkadotApi<unknown, unknown>

  const context = {
    origin: { api, chain: 'Polkadot' },
    dest: { api, chain: 'Acala' },
    reserve: { api, chain: 'Polkadot' },
    isSubBridge: false,
    assetInfo: {
      amount: 1_000_000_000n,
      symbol: 'DOT',
      decimals: 10,
      location: RELAY_LOCATION
    },
    isRelayAsset: false,
    options: {
      senderAddress: 'sender',
      address: 'dest',
      version: Version.V5,
      currency: { amount: '1', location: RELAY_LOCATION },
      feeCurrency: undefined
    }
  } as TTypeAndThenCallContext<unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()

    buildTx = vi.fn(() => Promise.resolve('tx'))

    vi.mocked(assertSenderAddress).mockImplementation(() => {})
    vi.mocked(assertAddressIsString).mockImplementation(() => {})
    vi.mocked(hasDryRunSupport).mockReturnValue(true)
    vi.mocked(isAssetEqual).mockReturnValue(true)
    vi.mocked(padValueBy).mockImplementation(value => value)
  })

  it('returns null fees when dry run is not supported', async () => {
    vi.mocked(hasDryRunSupport).mockReturnValue(false)

    const result = await computeAllFees(context, buildTx)

    expect(result).toEqual(null)

    expect(assertSenderAddress).toHaveBeenCalled()
    expect(assertAddressIsString).toHaveBeenCalled()
    expect(getXcmFeeInternal).not.toHaveBeenCalled()
    expect(padValueBy).not.toHaveBeenCalled()
  })

  it('returns computed fees when dry run is supported', async () => {
    const feeDetail: TXcmFeeDetail = {
      fee: 0n,
      feeType: 'dryRun',
      asset: context.assetInfo
    }

    vi.mocked(getXcmFeeInternal).mockResolvedValue({
      origin: feeDetail,
      destination: { ...feeDetail, fee: 30n },
      hops: [
        { chain: 'AssetHubPolkadot', result: { ...feeDetail, fee: 10n } },
        { chain: 'Acala', result: { ...feeDetail, fee: 20n } }
      ]
    })

    const result = await computeAllFees(context, buildTx)

    expect(result).toEqual({ hopFees: 30n, destFee: 30n })

    expect(getXcmFeeInternal).toHaveBeenCalledWith(
      expect.objectContaining({
        api,
        buildTx,
        origin: context.origin.chain,
        destination: context.dest.chain,
        senderAddress: context.options.senderAddress,
        address: context.options.address,
        currency: context.options.currency,
        feeAsset: context.options.feeCurrency,
        disableFallback: false,
        skipReverseFeeCalculation: true
      })
    )
    expect(padValueBy).toHaveBeenNthCalledWith(1, 30n, FEE_PADDING)
    expect(padValueBy).toHaveBeenNthCalledWith(2, 30n, FEE_PADDING)
  })

  it('skips fees for hops with non matching assets', async () => {
    const feeDetail: TXcmFeeDetail = {
      fee: 0n,
      feeType: 'dryRun',
      asset: context.assetInfo
    }

    vi.mocked(getXcmFeeInternal).mockResolvedValue({
      origin: feeDetail,
      destination: { ...feeDetail, fee: 5n },
      hops: [
        { chain: 'AssetHubPolkadot', result: { ...feeDetail, fee: 10n } },
        { chain: 'Acala', result: { ...feeDetail, fee: 25n } }
      ]
    })

    vi.mocked(isAssetEqual).mockReturnValueOnce(false).mockReturnValueOnce(true)

    const result = await computeAllFees(context, buildTx)

    expect(result).toEqual({ hopFees: 25n, destFee: 5n })
    expect(padValueBy).toHaveBeenNthCalledWith(1, 25n, FEE_PADDING)
    expect(padValueBy).toHaveBeenNthCalledWith(2, 5n, FEE_PADDING)
  })
})

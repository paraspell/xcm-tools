import { afterEach, describe, expect, it, vi } from 'vitest'

import { getXcmFee } from './getXcmFee'

vi.mock('@paraspell/assets', () => ({
  findAsset: vi.fn(),
  getNativeAssetSymbol: vi.fn(),
  InvalidCurrencyError: class InvalidCurrencyError extends Error {}
}))

vi.mock('@paraspell/sdk-common', () => ({
  isRelayChain: vi.fn().mockReturnValue(false)
}))

vi.mock('../../nodes/getTNode', () => ({
  getTNode: vi.fn()
}))

vi.mock('../../utils', () => ({
  determineRelayChain: vi.fn()
}))

vi.mock('./getFeeForOriginNode', () => ({
  getFeeForOriginNode: vi.fn()
}))

vi.mock('./getFeeForDestNode', () => ({
  getFeeForDestNode: vi.fn()
}))

class FakeApi {
  setDisconnectAllowed = vi.fn()
  disconnect = vi.fn().mockResolvedValue(undefined)
  clone = vi.fn().mockImplementation(() => new FakeApi())
  init = vi.fn().mockResolvedValue(undefined)
  getApi = vi.fn().mockReturnValue({ disconnect: vi.fn() })
}

import type { TAsset, TCurrencyInputWithAmount } from '@paraspell/assets'
import { findAsset, getNativeAssetSymbol, InvalidCurrencyError } from '@paraspell/assets'

import type { IPolkadotApi } from '../../api'
import { getTNode } from '../../nodes/getTNode'
import type { TGetXcmFeeOptions } from '../../types'
import { determineRelayChain } from '../../utils'
import { getFeeForDestNode } from './getFeeForDestNode'
import { getFeeForOriginNode } from './getFeeForOriginNode'

const createOptions = (overrides?: Partial<TGetXcmFeeOptions<unknown, unknown>>) =>
  ({
    api: new FakeApi() as unknown as IPolkadotApi<unknown, unknown>,
    tx: {} as unknown,
    origin: 'Acala',
    destination: 'Moonbeam',
    senderAddress: '5Alice',
    address: '5Bob',
    currency: 'ACA',
    ...overrides
  }) as unknown as TGetXcmFeeOptions<unknown, unknown>

afterEach(() => vi.resetAllMocks())

describe('getXcmFee', () => {
  it('throws InvalidCurrencyError when the asset is missing', async () => {
    vi.mocked(findAsset).mockReturnValue(null)

    await expect(getXcmFee(createOptions())).rejects.toBeInstanceOf(InvalidCurrencyError)
  })

  it('returns correct structure when origin dry-run fails', async () => {
    vi.mocked(findAsset).mockReturnValue({ symbol: 'ACA' } as TAsset)

    vi.mocked(getNativeAssetSymbol).mockImplementation((chain: string) =>
      chain === 'Acala' ? 'ACA' : 'GLMR'
    )

    vi.mocked(getFeeForOriginNode).mockResolvedValue({
      fee: 1_000n,
      feeType: 'paymentInfo',
      dryRunError: 'Simulation failed',
      forwardedXcms: undefined,
      destParaId: undefined
    })

    vi.mocked(getFeeForDestNode).mockResolvedValue({
      fee: 2_000n,
      feeType: 'paymentInfo'
    })

    const res = await getXcmFee(createOptions())

    expect(res).toEqual({
      origin: {
        fee: 1_000n,
        feeType: 'paymentInfo',
        currency: 'ACA',
        dryRunError: 'Simulation failed'
      },
      destination: {
        fee: 2_000n,
        feeType: 'paymentInfo',
        currency: 'GLMR'
      }
    })
  })

  it('computes fees when origin simulation succeeds and no hops are needed', async () => {
    vi.mocked(findAsset).mockReturnValue({ symbol: 'ACA' } as TAsset)

    vi.mocked(getNativeAssetSymbol).mockImplementation((chain: string) =>
      chain === 'Acala' ? 'ACA' : 'GLMR'
    )

    vi.mocked(getFeeForOriginNode).mockResolvedValue({
      fee: 1_000n,
      feeType: 'paymentInfo',
      dryRunError: undefined,
      forwardedXcms: undefined,
      destParaId: undefined
    })

    const res = await getXcmFee(createOptions())

    expect(getFeeForDestNode).not.toHaveBeenCalled()

    expect(res).toEqual({
      origin: {
        fee: 1_000n,
        feeType: 'paymentInfo',
        currency: 'ACA'
      },
      destination: {
        feeType: 'paymentInfo',
        currency: 'GLMR'
      }
    })
  })

  it('adds intermediate AssetHub fee when hop succeeds', async () => {
    vi.mocked(findAsset).mockReturnValue({ symbol: 'ACA' } as TAsset)

    vi.mocked(getNativeAssetSymbol).mockImplementation((chain: string) => {
      if (chain === 'Acala') return 'ACA'
      if (chain === 'AssetHubPolkadot') return 'DOT'
      return 'GLMR'
    })

    vi.mocked(determineRelayChain).mockReturnValue('Polkadot')

    vi.mocked(getFeeForOriginNode).mockResolvedValue({
      fee: 1_000n,
      feeType: 'paymentInfo',
      dryRunError: undefined,
      forwardedXcms: [null, [{ key: 'value' }]],
      destParaId: 1000
    })

    vi.mocked(getTNode).mockReturnValue('AssetHubPolkadot')

    vi.mocked(getFeeForDestNode).mockResolvedValueOnce({
      fee: 3_000n,
      feeType: 'paymentInfo',
      forwardedXcms: undefined,
      destParaId: undefined
    })

    const res = await getXcmFee(createOptions())

    expect(getFeeForDestNode).toHaveBeenCalledTimes(1)

    expect(res).toEqual({
      origin: {
        fee: 1_000n,
        feeType: 'paymentInfo',
        currency: 'ACA'
      },
      assetHub: {
        fee: 3_000n,
        feeType: 'paymentInfo',
        currency: 'DOT'
      },
      destination: {
        feeType: 'paymentInfo',
        currency: 'GLMR'
      }
    })
  })

  it('handles hop dry-run error and falls back to destination paymentInfo', async () => {
    vi.mocked(findAsset).mockReturnValue({ symbol: 'ACA' } as TAsset)

    vi.mocked(getNativeAssetSymbol).mockImplementation((chain: string) => {
      if (chain === 'Acala') return 'ACA'
      if (chain === 'AssetHubPolkadot') return 'DOT'
      return 'GLMR'
    })

    vi.mocked(determineRelayChain).mockReturnValue('Polkadot')

    vi.mocked(getFeeForOriginNode).mockResolvedValue({
      fee: 1_000n,
      feeType: 'paymentInfo',
      dryRunError: undefined,
      forwardedXcms: [null, [{ key: 'value' }]],
      destParaId: 1000
    })

    vi.mocked(getTNode).mockReturnValue('AssetHubPolkadot')

    vi.mocked(getFeeForDestNode)
      .mockResolvedValueOnce({
        fee: 3_000n,
        feeType: 'paymentInfo',
        dryRunError: 'Hop failed',
        forwardedXcms: undefined,
        destParaId: undefined
      })
      .mockResolvedValueOnce({
        fee: 2_000n,
        feeType: 'paymentInfo'
      })

    const res = await getXcmFee(createOptions())

    expect(getFeeForDestNode).toHaveBeenCalledTimes(2)

    expect(res).toEqual({
      origin: {
        fee: 1_000n,
        feeType: 'paymentInfo',
        currency: 'ACA'
      },
      assetHub: {
        fee: 3_000n,
        feeType: 'paymentInfo',
        currency: 'DOT',
        dryRunError: 'Hop failed'
      },
      destination: {
        fee: 2_000n,
        feeType: 'paymentInfo',
        currency: 'GLMR'
      }
    })
  })

  it('bypasses forwarded XCM and uses paymentInfo for AssetHubKusama -> Kusama', async () => {
    // Arrange mocks
    vi.mocked(findAsset).mockReturnValue({ symbol: 'KSM' } as TAsset)
    vi.mocked(getNativeAssetSymbol).mockImplementation((chain: string) =>
      chain === 'AssetHubKusama' ? 'KSM' : 'KSM'
    )
    vi.mocked(getFeeForOriginNode).mockResolvedValue({
      fee: 500n,
      feeType: 'paymentInfo',
      dryRunError: undefined,
      forwardedXcms: [null, [{ dummy: 'xcm' }]],
      destParaId: 123
    })
    vi.mocked(getFeeForDestNode).mockResolvedValue({ fee: 800n, feeType: 'paymentInfo' })

    const specialOpts = createOptions({
      origin: 'AssetHubKusama',
      destination: 'Kusama',
      currency: 'KSM' as unknown as TCurrencyInputWithAmount
    })

    const res = await getXcmFee(specialOpts)

    expect(getFeeForDestNode).toHaveBeenCalledTimes(1)
    expect(vi.mocked(getFeeForDestNode).mock.calls[0][0].forwardedXcms).toBeUndefined()

    expect(res).toEqual({
      origin: { fee: 500n, feeType: 'paymentInfo', currency: 'KSM' },
      destination: { fee: 800n, feeType: 'paymentInfo', currency: 'KSM' }
    })
  })
})

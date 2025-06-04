import type { TAsset } from '@paraspell/assets'
import { findAssetForNodeOrThrow, getNativeAssetSymbol } from '@paraspell/assets'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { getTNode } from '../../nodes/getTNode'
import type { TGetXcmFeeOptions } from '../../types'
import { determineRelayChain } from '../../utils'
import { getDestXcmFee } from './getDestXcmFee'
import { getOriginXcmFee } from './getOriginXcmFee'
import { getXcmFee } from './getXcmFee'

vi.mock('@paraspell/assets', () => ({
  findAssetForNodeOrThrow: vi.fn(),
  getNativeAssetSymbol: vi.fn()
}))

vi.mock('@paraspell/sdk-common', async importOriginal => ({
  ...(await importOriginal<typeof import('@paraspell/sdk-common')>()),
  isRelayChain: vi.fn().mockReturnValue(false)
}))

vi.mock('../../nodes/getTNode', () => ({
  getTNode: vi.fn()
}))

vi.mock('../../utils', () => ({
  determineRelayChain: vi.fn()
}))

vi.mock('./getOriginXcmFee', () => ({
  getOriginXcmFee: vi.fn()
}))

vi.mock('./getDestXcmFee', () => ({
  getDestXcmFee: vi.fn()
}))

const createOptions = (overrides?: Partial<TGetXcmFeeOptions<unknown, unknown>>) =>
  ({
    api: {
      setDisconnectAllowed: vi.fn(),
      disconnect: vi.fn().mockResolvedValue(undefined),
      clone: vi.fn().mockImplementation(() => createOptions(overrides).api),
      init: vi.fn().mockResolvedValue(undefined),
      getApi: vi.fn().mockReturnValue({ disconnect: vi.fn() })
    } as unknown as IPolkadotApi<unknown, unknown>,
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
  it('returns correct structure when origin dry-run fails', async () => {
    vi.mocked(findAssetForNodeOrThrow).mockReturnValue({ symbol: 'ACA' } as TAsset)

    vi.mocked(getNativeAssetSymbol).mockImplementation((chain: string) =>
      chain === 'Acala' ? 'ACA' : 'GLMR'
    )

    vi.mocked(getOriginXcmFee).mockResolvedValue({
      fee: 1_000n,
      currency: 'ACA',
      feeType: 'paymentInfo',
      dryRunError: 'Simulation failed',
      forwardedXcms: undefined,
      destParaId: undefined
    })

    vi.mocked(getDestXcmFee).mockResolvedValue({
      fee: 2_000n,
      feeType: 'paymentInfo'
    })

    const res = await getXcmFee(createOptions())

    expect(res).toEqual({
      failureReason: 'Simulation failed',
      failureChain: 'origin',
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

  it('returns correct structure when origin does not support dry-run, returns paymentInfo, destination should also use paymentInfo', async () => {
    vi.mocked(findAssetForNodeOrThrow).mockReturnValue({ symbol: 'ACA' } as TAsset)

    vi.mocked(getNativeAssetSymbol).mockImplementation((chain: string) =>
      chain === 'Acala' ? 'ACA' : 'GLMR'
    )

    vi.mocked(getOriginXcmFee).mockResolvedValue({
      fee: 1_000n,
      currency: 'ACA',
      feeType: 'paymentInfo',
      dryRunError: undefined,
      forwardedXcms: undefined,
      destParaId: undefined
    })

    vi.mocked(getDestXcmFee).mockResolvedValue({
      fee: 2_000n,
      feeType: 'paymentInfo'
    })

    const res = await getXcmFee(createOptions())

    expect(res).toEqual({
      origin: {
        fee: 1_000n,
        feeType: 'paymentInfo',
        currency: 'ACA'
      },
      destination: {
        fee: 2_000n,
        feeType: 'paymentInfo',
        currency: 'GLMR'
      }
    })
  })

  it('computes fees when origin simulation succeeds and no hops are needed', async () => {
    vi.mocked(findAssetForNodeOrThrow).mockReturnValue({ symbol: 'ACA' } as TAsset)

    vi.mocked(getNativeAssetSymbol).mockImplementation((chain: string) =>
      chain === 'Acala' ? 'ACA' : 'GLMR'
    )

    vi.mocked(getOriginXcmFee).mockResolvedValue({
      fee: 1_000n,
      currency: 'ACA',
      feeType: 'dryRun',
      dryRunError: undefined,
      forwardedXcms: undefined,
      destParaId: undefined
    })

    const res = await getXcmFee(createOptions())

    expect(getDestXcmFee).not.toHaveBeenCalled()

    expect(res).toEqual({
      origin: {
        fee: 1_000n,
        feeType: 'dryRun',
        currency: 'ACA'
      },
      destination: {
        fee: 0n,
        feeType: 'paymentInfo',
        currency: 'GLMR'
      }
    })
  })

  it('adds intermediate AssetHub fee when hop succeeds', async () => {
    vi.mocked(findAssetForNodeOrThrow).mockReturnValue({ symbol: 'ACA' } as TAsset)

    vi.mocked(getNativeAssetSymbol).mockImplementation((chain: string) => {
      if (chain === 'Acala') return 'ACA'
      if (chain === 'AssetHubPolkadot') return 'DOT'
      return 'GLMR'
    })

    vi.mocked(determineRelayChain).mockReturnValue('Polkadot')

    vi.mocked(getOriginXcmFee).mockResolvedValue({
      fee: 1_000n,
      currency: 'ACA',
      feeType: 'dryRun',
      dryRunError: undefined,
      forwardedXcms: [null, [{ key: 'value' }]],
      destParaId: 1000
    })

    vi.mocked(getTNode).mockReturnValue('AssetHubPolkadot')

    vi.mocked(getDestXcmFee).mockResolvedValueOnce({
      fee: 3_000n,
      feeType: 'paymentInfo',
      forwardedXcms: undefined,
      destParaId: undefined
    })

    const res = await getXcmFee(createOptions())

    expect(getDestXcmFee).toHaveBeenCalledTimes(1)

    expect(res).toEqual({
      origin: {
        fee: 1_000n,
        feeType: 'dryRun',
        currency: 'ACA'
      },
      assetHub: {
        fee: 3_000n,
        feeType: 'paymentInfo',
        currency: 'DOT'
      },
      destination: {
        fee: 0n,
        feeType: 'paymentInfo',
        currency: 'GLMR'
      }
    })
  })

  it('handles hop dry-run error and falls back to destination paymentInfo', async () => {
    vi.mocked(findAssetForNodeOrThrow).mockReturnValue({ symbol: 'ACA' } as TAsset)

    vi.mocked(getNativeAssetSymbol).mockImplementation((chain: string) => {
      if (chain === 'Acala') return 'ACA'
      if (chain === 'AssetHubPolkadot') return 'DOT'
      return 'GLMR'
    })

    vi.mocked(determineRelayChain).mockReturnValue('Polkadot')

    vi.mocked(getOriginXcmFee).mockResolvedValue({
      fee: 1_000n,
      currency: 'ACA',
      feeType: 'dryRun',
      dryRunError: undefined,
      forwardedXcms: [null, [{ key: 'value' }]],
      destParaId: 1000
    })

    vi.mocked(getTNode).mockReturnValue('AssetHubPolkadot')

    vi.mocked(getDestXcmFee)
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

    expect(getDestXcmFee).toHaveBeenCalledTimes(2)

    expect(res).toEqual({
      failureReason: 'Hop failed',
      failureChain: 'assetHub',
      origin: {
        fee: 1_000n,
        feeType: 'dryRun',
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
})

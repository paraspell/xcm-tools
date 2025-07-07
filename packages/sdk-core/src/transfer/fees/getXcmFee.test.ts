import type { TAsset } from '@paraspell/assets'
import {
  findAssetForNodeOrThrow,
  findAssetOnDestOrThrow,
  getNativeAssetSymbol
} from '@paraspell/assets'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { getTNode } from '../../nodes/getTNode'
import type { TGetXcmFeeOptions } from '../../types'
import { getRelayChainOf } from '../../utils'
import { getDestXcmFee } from './getDestXcmFee'
import { getOriginXcmFee } from './getOriginXcmFee'
import { getXcmFee } from './getXcmFee'

vi.mock('@paraspell/assets', () => ({
  findAssetForNodeOrThrow: vi.fn(),
  findAssetOnDestOrThrow: vi.fn(),
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
  getRelayChainOf: vi.fn()
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

describe('getXcmFee', () => {
  afterEach(() => vi.resetAllMocks())

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
      hops: [],
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
      hops: [],
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
      hops: [],
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

    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')

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
      hops: [
        {
          chain: 'AssetHubPolkadot',
          result: {
            fee: 3_000n,
            feeType: 'paymentInfo',
            currency: 'DOT',
            dryRunError: undefined,
            sufficient: undefined
          }
        }
      ],
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

    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')

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
      hops: [
        {
          chain: 'AssetHubPolkadot',
          result: {
            fee: 3_000n,
            feeType: 'paymentInfo',
            currency: 'DOT',
            dryRunError: 'Hop failed',
            sufficient: undefined
          }
        }
      ],
      destination: {
        fee: 2_000n,
        feeType: 'paymentInfo',
        currency: 'GLMR'
      }
    })
  })

  it('handles multiple hops including AssetHub and BridgeHub', async () => {
    vi.mocked(findAssetForNodeOrThrow).mockReturnValue({ symbol: 'ACA' } as TAsset)
    vi.mocked(getNativeAssetSymbol).mockImplementation((chain: string) => {
      if (chain === 'Acala') return 'ACA'
      if (chain === 'AssetHubPolkadot') return 'ACA'
      if (chain === 'BridgeHubPolkadot') return 'BRIDGE'
      return 'GLMR'
    })
    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')

    vi.mocked(getOriginXcmFee).mockResolvedValue({
      fee: 1_000n,
      currency: 'ACA',
      feeType: 'dryRun',
      dryRunError: undefined,
      forwardedXcms: [null, [{ foo: 1 }, {}]],
      destParaId: 1000
    })

    vi.mocked(getTNode)
      .mockReturnValueOnce('AssetHubPolkadot')
      .mockReturnValueOnce('BridgeHubPolkadot')

    vi.mocked(getDestXcmFee)
      .mockResolvedValueOnce({
        fee: 3_000n,
        feeType: 'dryRun',
        forwardedXcms: [null, [{ key: 1 }]],
        destParaId: 2000,
        sufficient: true
      })
      .mockResolvedValueOnce({
        fee: 4_000n,
        feeType: 'paymentInfo',
        forwardedXcms: undefined,
        destParaId: undefined,
        sufficient: false
      })

    const res = await getXcmFee(createOptions())

    expect(res.hops).toHaveLength(2)
    expect(res.hops).toEqual([
      {
        chain: 'AssetHubPolkadot',
        result: {
          fee: 3_000n,
          feeType: 'dryRun',
          currency: 'ACA',
          sufficient: true
        }
      },
      {
        chain: 'BridgeHubPolkadot',
        result: {
          fee: 4_000n,
          feeType: 'paymentInfo',
          currency: 'BRIDGE',
          sufficient: false
        }
      }
    ])

    expect(res.assetHub).toEqual({
      fee: 3_000n,
      feeType: 'dryRun',
      currency: 'ACA',
      sufficient: true
    })
    expect(res.bridgeHub).toEqual({
      fee: 4_000n,
      feeType: 'paymentInfo',
      currency: 'BRIDGE',
      sufficient: false
    })
    expect(res.destination).toMatchObject({ fee: 0n })
  })

  it('handles swapConfig with exchange chain in hop route - updates asset after exchange', async () => {
    const initialAsset = { symbol: 'ACA' } as TAsset
    const swappedAsset = { symbol: 'USDT' } as TAsset

    vi.mocked(findAssetForNodeOrThrow).mockReturnValue(initialAsset)
    vi.mocked(findAssetOnDestOrThrow).mockReturnValue(swappedAsset)

    vi.mocked(getNativeAssetSymbol).mockImplementation((chain: string) => {
      if (chain === 'Acala') return 'ACA'
      if (chain === 'AssetHubPolkadot') return 'DOT'
      if (chain === 'HydraDX') return 'HDX'
      return 'GLMR'
    })

    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')

    vi.mocked(getOriginXcmFee).mockResolvedValue({
      fee: 1_000n,
      currency: 'ACA',
      feeType: 'dryRun',
      dryRunError: undefined,
      forwardedXcms: [null, [{ key: 'value' }]],
      destParaId: 1000
    })

    vi.mocked(getTNode)
      .mockReturnValueOnce('AssetHubPolkadot')
      .mockReturnValueOnce('Hydration')
      .mockReturnValueOnce('Moonbeam')

    vi.mocked(getDestXcmFee)
      .mockResolvedValueOnce({
        fee: 2_000n,
        feeType: 'dryRun',
        forwardedXcms: [null, [{ key: 'value2' }]],
        destParaId: 2034,
        sufficient: true
      })
      .mockResolvedValueOnce({
        fee: 3_000n,
        feeType: 'dryRun',
        forwardedXcms: [null, [{ key: 'value3' }]],
        destParaId: 2004,
        sufficient: true
      })
      .mockResolvedValueOnce({
        fee: 4_000n,
        feeType: 'dryRun',
        forwardedXcms: undefined,
        destParaId: undefined,
        sufficient: false
      })

    const res = await getXcmFee(
      createOptions({
        swapConfig: {
          exchangeChain: 'Hydration',
          currencyTo: { symbol: 'USDT' }
        }
      })
    )

    expect(findAssetOnDestOrThrow).toHaveBeenCalledWith('Hydration', 'Hydration', {
      symbol: 'USDT'
    })
    expect(findAssetOnDestOrThrow).toHaveBeenCalledWith('Hydration', 'Moonbeam', { symbol: 'USDT' })

    expect(res.hops).toHaveLength(2)
    expect(res.hops[0]).toEqual({
      chain: 'AssetHubPolkadot',
      result: {
        fee: 2_000n,
        feeType: 'dryRun',
        currency: 'ACA',
        sufficient: true
      }
    })
    expect(res.hops[1]).toEqual({
      chain: 'Hydration',
      result: {
        fee: 3_000n,
        feeType: 'dryRun',
        currency: 'ACA',
        sufficient: true
      }
    })

    expect(res.destination).toMatchObject({
      fee: 4_000n,
      feeType: 'dryRun',
      currency: 'USDT',
      sufficient: false
    })
  })
})

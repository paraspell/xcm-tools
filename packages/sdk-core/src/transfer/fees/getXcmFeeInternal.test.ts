import type { TAssetInfo } from '@paraspell/assets'
import {
  findAssetInfoOrThrow,
  findAssetOnDestOrThrow,
  findNativeAssetInfoOrThrow,
  getNativeAssetSymbol
} from '@paraspell/assets'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import type {
  HopProcessParams,
  TGetXcmFeeInternalOptions,
  TGetXcmFeeOptions,
  TXcmFeeHopResult
} from '../../types'
import { getRelayChainOf } from '../../utils'
import { addEthereumBridgeFees, traverseXcmHops } from '../dry-run'
import { getDestXcmFee } from './getDestXcmFee'
import { getOriginXcmFeeInternal } from './getOriginXcmFeeInternal'
import { getXcmFeeInternal } from './getXcmFeeInternal'

vi.mock('@paraspell/assets')
vi.mock('@paraspell/sdk-common', async importOriginal => ({
  ...(await importOriginal<typeof import('@paraspell/sdk-common')>()),
  isRelayChain: vi.fn().mockReturnValue(false)
}))

vi.mock('../../chains/getTChain')
vi.mock('../../utils')
vi.mock('../dry-run')
vi.mock('./getOriginXcmFeeInternal')
vi.mock('./getDestXcmFee')

const createOptions = (overrides?: Partial<TGetXcmFeeOptions<unknown, unknown>>) =>
  ({
    api: {
      setDisconnectAllowed: vi.fn(),
      disconnect: vi.fn().mockResolvedValue(undefined),
      clone: vi.fn().mockImplementation(() => createOptions(overrides).api),
      init: vi.fn().mockResolvedValue(undefined),
      getApi: vi.fn().mockReturnValue({ disconnect: vi.fn() })
    } as unknown as IPolkadotApi<unknown, unknown>,
    builder: {} as unknown,
    origin: 'Acala',
    destination: 'Moonbeam',
    senderAddress: '5Alice',
    address: '5Bob',
    currency: 'ACA',
    useRootOrigin: false,
    ...overrides
  }) as unknown as TGetXcmFeeInternalOptions<unknown, unknown>

describe('getXcmFeeInternal', () => {
  const xcmFeeResCurrency = {
    currency: 'ACA',
    asset: { symbol: 'ACA', decimals: 12 } as TAssetInfo
  }

  const xcmFeeResultbase = {
    ...xcmFeeResCurrency,
    fee: 1000n
  }

  afterEach(() => vi.resetAllMocks())

  it('returns correct structure when origin dry-run fails', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)

    vi.mocked(getNativeAssetSymbol).mockReturnValue('GLMR')

    vi.mocked(getOriginXcmFeeInternal).mockResolvedValue({
      ...xcmFeeResultbase,
      feeType: 'paymentInfo',
      dryRunError: 'Simulation failed',
      forwardedXcms: undefined,
      destParaId: undefined
    })

    vi.mocked(getDestXcmFee).mockResolvedValue({
      ...xcmFeeResCurrency,
      fee: 2_000n,
      feeType: 'paymentInfo'
    })

    const res = await getXcmFeeInternal(createOptions())

    expect(res).toEqual({
      failureReason: 'Simulation failed',
      failureChain: 'origin',
      origin: {
        fee: 1_000n,
        feeType: 'paymentInfo',
        currency: 'ACA',
        asset: { symbol: 'ACA', decimals: 12 },
        dryRunError: 'Simulation failed'
      },
      hops: [],
      destination: {
        fee: 2_000n,
        feeType: 'paymentInfo',
        currency: 'GLMR',
        asset: { symbol: 'ACA' }
      }
    })
  })

  it('returns correct structure when origin does not support dry-run, returns paymentInfo, destination should also use paymentInfo', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)

    vi.mocked(getNativeAssetSymbol).mockReturnValue('GLMR')

    vi.mocked(getOriginXcmFeeInternal).mockResolvedValue({
      ...xcmFeeResultbase,
      feeType: 'paymentInfo',
      dryRunError: undefined,
      forwardedXcms: undefined,
      destParaId: undefined
    })

    vi.mocked(getDestXcmFee).mockResolvedValue({
      ...xcmFeeResCurrency,
      fee: 2_000n,
      feeType: 'paymentInfo'
    })

    const res = await getXcmFeeInternal(createOptions())

    expect(res).toEqual({
      origin: {
        fee: 1_000n,
        feeType: 'paymentInfo',
        currency: 'ACA',
        asset: { symbol: 'ACA', decimals: 12 }
      },
      hops: [],
      destination: {
        fee: 2_000n,
        feeType: 'paymentInfo',
        currency: 'GLMR',
        asset: { symbol: 'ACA' }
      }
    })
  })

  it('computes fees when origin simulation succeeds and no hops are needed', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)

    vi.mocked(getNativeAssetSymbol).mockReturnValue('GLMR')

    vi.mocked(getOriginXcmFeeInternal).mockResolvedValue({
      ...xcmFeeResultbase,
      feeType: 'dryRun',
      dryRunError: undefined,
      forwardedXcms: undefined,
      destParaId: undefined
    })

    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')

    vi.mocked(traverseXcmHops).mockResolvedValue({
      hops: [],
      lastProcessedChain: 'Acala',
      destination: undefined,
      assetHub: undefined,
      bridgeHub: undefined
    })

    vi.mocked(addEthereumBridgeFees).mockResolvedValue(undefined)

    const res = await getXcmFeeInternal(createOptions())

    expect(getDestXcmFee).not.toHaveBeenCalled()

    expect(res).toEqual({
      origin: {
        fee: 1_000n,
        feeType: 'dryRun',
        currency: 'ACA',
        asset: { symbol: 'ACA', decimals: 12 }
      },
      hops: [],
      destination: {
        fee: 0n,
        feeType: 'noFeeRequired',
        sufficient: true,
        currency: 'GLMR',
        asset: { symbol: 'ACA' }
      },
      failureChain: undefined,
      failureReason: undefined
    })
  })

  it('adds intermediate AssetHub fee when hop succeeds', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)

    vi.mocked(getNativeAssetSymbol).mockImplementation((chain: string) => {
      if (chain === 'AssetHubPolkadot') return 'DOT'
      return 'GLMR'
    })

    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')

    vi.mocked(getOriginXcmFeeInternal).mockResolvedValue({
      ...xcmFeeResultbase,
      feeType: 'dryRun',
      dryRunError: undefined,
      forwardedXcms: [null, [{ key: 'value' }]],
      destParaId: 1000
    })

    vi.mocked(traverseXcmHops).mockResolvedValue({
      hops: [
        {
          chain: 'AssetHubPolkadot',
          result: {
            fee: 3_000n,
            feeType: 'paymentInfo',
            currency: 'DOT'
          }
        }
      ],
      lastProcessedChain: 'AssetHubPolkadot',
      destination: undefined,
      assetHub: {
        fee: 3_000n,
        feeType: 'paymentInfo',
        currency: 'DOT'
      },
      bridgeHub: undefined
    })

    vi.mocked(addEthereumBridgeFees).mockResolvedValue(undefined)

    const res = await getXcmFeeInternal(createOptions())

    expect(res).toEqual({
      origin: {
        fee: 1_000n,
        feeType: 'dryRun',
        currency: 'ACA',
        asset: { symbol: 'ACA', decimals: 12 }
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
            currency: 'DOT'
          }
        }
      ],
      destination: {
        fee: 0n,
        feeType: 'noFeeRequired',
        sufficient: true,
        currency: 'GLMR',
        asset: { symbol: 'ACA' }
      },
      failureChain: undefined,
      failureReason: undefined
    })
  })

  it('handles hop dry-run error and falls back to destination paymentInfo', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)

    vi.mocked(getNativeAssetSymbol).mockImplementation((chain: string) => {
      if (chain === 'AssetHubPolkadot') return 'DOT'
      return 'GLMR'
    })

    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')

    vi.mocked(getOriginXcmFeeInternal).mockResolvedValue({
      ...xcmFeeResultbase,
      feeType: 'dryRun',
      dryRunError: undefined,
      forwardedXcms: [null, [{ key: 'value' }]],
      destParaId: 1000
    })

    vi.mocked(traverseXcmHops).mockResolvedValue({
      hops: [
        {
          chain: 'AssetHubPolkadot',
          result: {
            fee: 3_000n,
            feeType: 'paymentInfo',
            currency: 'DOT',
            dryRunError: 'Hop failed'
          }
        }
      ],
      lastProcessedChain: 'AssetHubPolkadot',
      destination: undefined,
      assetHub: {
        fee: 3_000n,
        feeType: 'paymentInfo',
        currency: 'DOT',
        dryRunError: 'Hop failed'
      },
      bridgeHub: undefined
    })

    vi.mocked(addEthereumBridgeFees).mockResolvedValue(undefined)

    vi.mocked(getDestXcmFee).mockResolvedValue({
      asset: { symbol: 'GLMR', decimals: 12 } as TAssetInfo,
      fee: 2_000n,
      feeType: 'paymentInfo'
    })

    const res = await getXcmFeeInternal(createOptions())

    expect(getDestXcmFee).toHaveBeenCalledTimes(1)

    expect(res).toEqual({
      failureReason: 'Hop failed',
      failureChain: 'assetHub',
      origin: {
        fee: 1_000n,
        feeType: 'dryRun',
        currency: 'ACA',
        asset: { symbol: 'ACA', decimals: 12 }
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
            dryRunError: 'Hop failed'
          }
        }
      ],
      destination: {
        fee: 2_000n,
        feeType: 'paymentInfo',
        sufficient: undefined,
        currency: 'GLMR',
        asset: { symbol: 'ACA' }
      }
    })
  })

  it('handles multiple hops including AssetHub and BridgeHub', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
    vi.mocked(getNativeAssetSymbol).mockImplementation((chain: string) => {
      if (chain === 'Acala') return 'ACA'
      if (chain === 'AssetHubPolkadot') return 'DOT'
      if (chain === 'BridgeHubPolkadot') return 'DOT'
      return 'GLMR'
    })
    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')

    vi.mocked(getOriginXcmFeeInternal).mockResolvedValue({
      ...xcmFeeResultbase,
      feeType: 'dryRun',
      dryRunError: undefined,
      forwardedXcms: [null, [{ foo: 1 }, {}]],
      destParaId: 1000
    })

    vi.mocked(traverseXcmHops).mockResolvedValue({
      hops: [
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
            currency: 'DOT',
            sufficient: false
          }
        }
      ],
      lastProcessedChain: 'BridgeHubPolkadot',
      destination: undefined,
      assetHub: {
        fee: 3_000n,
        feeType: 'dryRun',
        currency: 'ACA',
        sufficient: true
      },
      bridgeHub: {
        fee: 4_000n,
        feeType: 'paymentInfo',
        currency: 'DOT',
        sufficient: false
      }
    })

    vi.mocked(addEthereumBridgeFees<unknown, unknown, TXcmFeeHopResult>).mockResolvedValue({
      ...xcmFeeResultbase,
      feeType: 'paymentInfo',
      sufficient: false
    })

    const res = await getXcmFeeInternal(createOptions())

    expect(res.hops).toHaveLength(2)
    expect(res.hops).toEqual([
      {
        chain: 'AssetHubPolkadot',
        result: {
          fee: 3000n,
          feeType: 'dryRun',
          currency: 'ACA',
          sufficient: true
        }
      },
      {
        chain: 'BridgeHubPolkadot',
        result: {
          fee: 1000n,
          feeType: 'paymentInfo',
          currency: 'DOT',
          sufficient: false
        }
      }
    ])

    expect(res.assetHub).toEqual({
      fee: 3000n,
      feeType: 'dryRun',
      currency: 'ACA',
      sufficient: true
    })
    expect(res.bridgeHub).toEqual({
      fee: 1000n,
      feeType: 'paymentInfo',
      currency: 'ACA',
      asset: { symbol: 'ACA', decimals: 12 },
      sufficient: false
    })
    expect(res.destination).toMatchObject({
      fee: 0n,
      feeType: 'noFeeRequired',
      sufficient: true,
      currency: 'GLMR'
    })
  })

  it('handles swapConfig with exchange chain in hop route - updates asset after exchange', async () => {
    const initialAsset = { symbol: 'ACA' } as TAssetInfo
    const swappedAsset = { symbol: 'USDT' } as TAssetInfo

    vi.mocked(findAssetInfoOrThrow).mockReturnValue(initialAsset)
    vi.mocked(findAssetOnDestOrThrow).mockReturnValue(swappedAsset)

    vi.mocked(getNativeAssetSymbol).mockImplementation((chain: string) => {
      if (chain === 'Acala') return 'ACA'
      if (chain === 'AssetHubPolkadot') return 'DOT'
      if (chain === 'Hydration') return 'HDX'
      return 'GLMR'
    })

    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')

    vi.mocked(getOriginXcmFeeInternal).mockResolvedValue({
      ...xcmFeeResultbase,
      feeType: 'dryRun',
      dryRunError: undefined,
      forwardedXcms: [null, [{ key: 'value' }]],
      destParaId: 1000
    })

    vi.mocked(traverseXcmHops).mockResolvedValue({
      hops: [
        {
          chain: 'AssetHubPolkadot',
          result: {
            fee: 2_000n,
            feeType: 'dryRun',
            currency: 'ACA',
            sufficient: true
          }
        },
        {
          chain: 'Hydration',
          result: {
            fee: 3_000n,
            feeType: 'dryRun',
            currency: 'ACA',
            sufficient: true
          }
        }
      ],
      lastProcessedChain: 'Hydration',
      destination: {
        fee: 4_000n,
        feeType: 'dryRun',
        currency: 'USDT',
        sufficient: false
      },
      assetHub: {
        fee: 2_000n,
        feeType: 'dryRun',
        currency: 'ACA',
        sufficient: true
      },
      bridgeHub: undefined
    })

    vi.mocked(addEthereumBridgeFees).mockResolvedValue(undefined)

    const res = await getXcmFeeInternal(
      createOptions({
        swapConfig: {
          exchangeChain: 'Hydration',
          currencyTo: { symbol: 'USDT' }
        }
      })
    )

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

  it('handles Ethereum as destination with noFeeRequired', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
    vi.mocked(getNativeAssetSymbol).mockReturnValue('ETH')
    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')

    vi.mocked(getOriginXcmFeeInternal).mockResolvedValue({
      ...xcmFeeResultbase,
      feeType: 'dryRun',
      dryRunError: undefined,
      forwardedXcms: [null, [{ key: 'value' }]],
      destParaId: 1000
    })

    vi.mocked(traverseXcmHops).mockResolvedValue({
      hops: [],
      lastProcessedChain: 'Acala',
      destination: undefined,
      assetHub: undefined,
      bridgeHub: undefined
    })

    vi.mocked(addEthereumBridgeFees).mockResolvedValue(undefined)

    const res = await getXcmFeeInternal(createOptions({ destination: 'Ethereum' }))

    expect(res.destination).toMatchObject({
      fee: 0n,
      feeType: 'noFeeRequired',
      sufficient: true,
      currency: 'ETH'
    })
  })

  it('handles bridge hub fee updates after Ethereum bridge processing', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
    vi.mocked(getNativeAssetSymbol).mockImplementation((chain: string) => {
      if (chain === 'BridgeHubPolkadot') return 'DOT'
      return 'ACA'
    })
    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')

    vi.mocked(getOriginXcmFeeInternal).mockResolvedValue({
      ...xcmFeeResultbase,
      feeType: 'dryRun',
      dryRunError: undefined,
      forwardedXcms: [null, [{ key: 'value' }]],
      destParaId: 1000
    })

    vi.mocked(traverseXcmHops).mockResolvedValue({
      hops: [
        {
          chain: 'BridgeHubPolkadot',
          result: {
            fee: 2_000n,
            feeType: 'paymentInfo',
            currency: 'DOT'
          }
        }
      ],
      lastProcessedChain: 'BridgeHubPolkadot',
      destination: undefined,
      assetHub: undefined,
      bridgeHub: {
        fee: 2_000n,
        feeType: 'paymentInfo',
        currency: 'DOT'
      }
    })

    vi.mocked(addEthereumBridgeFees<unknown, unknown, TXcmFeeHopResult>).mockResolvedValue({
      ...xcmFeeResultbase,
      feeType: 'paymentInfo',
      currency: 'DOT'
    })

    const res = await getXcmFeeInternal(createOptions({ destination: 'Ethereum' }))

    expect(res.hops[0].result.fee).toBe(1_000n)
    expect(res.bridgeHub?.fee).toBe(1_000n)
  })

  it('handles sufficient field being undefined in origin fee', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
    vi.mocked(getNativeAssetSymbol).mockReturnValue('ACA')
    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')

    vi.mocked(getOriginXcmFeeInternal).mockResolvedValue({
      ...xcmFeeResultbase,
      feeType: 'dryRun',
      dryRunError: undefined,
      forwardedXcms: undefined,
      destParaId: undefined,
      sufficient: undefined
    })

    vi.mocked(traverseXcmHops).mockResolvedValue({
      hops: [],
      lastProcessedChain: 'Acala',
      destination: undefined,
      assetHub: undefined,
      bridgeHub: undefined
    })

    vi.mocked(addEthereumBridgeFees).mockResolvedValue(undefined)

    const res = await getXcmFeeInternal(createOptions())

    expect(res.origin).not.toHaveProperty('sufficient')
  })

  it('handles weight field in origin fee', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
    vi.mocked(getNativeAssetSymbol).mockReturnValue('ACA')
    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')

    vi.mocked(getOriginXcmFeeInternal).mockResolvedValue({
      ...xcmFeeResultbase,
      feeType: 'dryRun',
      dryRunError: undefined,
      forwardedXcms: undefined,
      destParaId: undefined,
      weight: { refTime: 1000000n, proofSize: 5000n }
    })

    vi.mocked(traverseXcmHops).mockResolvedValue({
      hops: [],
      lastProcessedChain: 'Acala',
      destination: undefined,
      assetHub: undefined,
      bridgeHub: undefined
    })

    vi.mocked(addEthereumBridgeFees).mockResolvedValue(undefined)

    const res = await getXcmFeeInternal(createOptions())

    expect(res.origin).toHaveProperty('weight')
    expect(res.origin.weight).toEqual({ refTime: 1000000n, proofSize: 5000n })
  })

  it('handles hop failure with different chain in failureChain detection', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
    vi.mocked(getNativeAssetSymbol).mockImplementation((chain: string) => {
      if (chain === 'Acala') return 'ACA'
      if (chain === 'CustomChain') return 'CUSTOM'
      return 'GLMR'
    })
    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')

    vi.mocked(getOriginXcmFeeInternal).mockResolvedValue({
      ...xcmFeeResultbase,
      feeType: 'dryRun',
      dryRunError: undefined,
      forwardedXcms: [null, [{ key: 'value' }]],
      destParaId: 1000
    })

    vi.mocked(traverseXcmHops).mockResolvedValue({
      hops: [
        {
          chain: 'Quartz',
          result: {
            fee: 3_000n,
            feeType: 'paymentInfo',
            currency: 'CUSTOM',
            dryRunError: 'Custom chain failed'
          }
        }
      ],
      lastProcessedChain: 'Quartz',
      destination: undefined,
      assetHub: undefined,
      bridgeHub: undefined
    })

    vi.mocked(addEthereumBridgeFees).mockResolvedValue(undefined)
    vi.mocked(getDestXcmFee).mockResolvedValue({
      ...xcmFeeResultbase,
      feeType: 'paymentInfo'
    })

    const res = await getXcmFeeInternal(createOptions())

    expect(res.failureChain).toBe('Quartz')
    expect(res.failureReason).toBe('Custom chain failed')
  })

  it('handles bridgeHub dry run error in failureChain detection', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
    vi.mocked(getNativeAssetSymbol).mockReturnValue('ACA')
    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')

    vi.mocked(getOriginXcmFeeInternal).mockResolvedValue({
      ...xcmFeeResultbase,
      feeType: 'dryRun',
      dryRunError: undefined,
      forwardedXcms: undefined,
      destParaId: undefined
    })

    vi.mocked(traverseXcmHops).mockResolvedValue({
      hops: [],
      lastProcessedChain: 'Acala',
      destination: undefined,
      assetHub: undefined,
      bridgeHub: {
        fee: 2_000n,
        feeType: 'paymentInfo',
        currency: 'DOT',
        dryRunError: 'BridgeHub failed'
      }
    })

    vi.mocked(addEthereumBridgeFees<unknown, unknown, TXcmFeeHopResult>).mockResolvedValue({
      ...xcmFeeResultbase,
      feeType: 'paymentInfo',
      dryRunError: 'BridgeHub failed'
    })

    const res = await getXcmFeeInternal(createOptions())

    expect(res.failureChain).toBe('bridgeHub')
    expect(res.failureReason).toBe('BridgeHub failed')
  })

  it('handles destination dry run error in failureChain detection', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
    vi.mocked(getNativeAssetSymbol).mockReturnValue('ACA')
    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')

    vi.mocked(getOriginXcmFeeInternal).mockResolvedValue({
      ...xcmFeeResultbase,
      feeType: 'dryRun',
      dryRunError: undefined,
      forwardedXcms: undefined,
      destParaId: undefined
    })

    vi.mocked(traverseXcmHops).mockResolvedValue({
      hops: [],
      lastProcessedChain: 'Acala',
      destination: {
        fee: 2_000n,
        feeType: 'paymentInfo',
        currency: 'GLMR',
        dryRunError: 'Destination failed'
      },
      assetHub: undefined,
      bridgeHub: undefined
    })

    vi.mocked(addEthereumBridgeFees).mockResolvedValue(undefined)

    const res = await getXcmFeeInternal(createOptions())

    expect(res.failureChain).toBe('destination')
    expect(res.failureReason).toBe('Destination failed')
  })

  it('handles case where no failures occur', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
    vi.mocked(getNativeAssetSymbol).mockReturnValue('ACA')
    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')

    vi.mocked(getOriginXcmFeeInternal).mockResolvedValue({
      ...xcmFeeResultbase,
      feeType: 'dryRun',
      dryRunError: undefined,
      forwardedXcms: undefined,
      destParaId: undefined
    })

    vi.mocked(traverseXcmHops).mockResolvedValue({
      hops: [],
      lastProcessedChain: 'Acala',
      destination: {
        fee: 2_000n,
        feeType: 'dryRun',
        currency: 'GLMR'
      },
      assetHub: undefined,
      bridgeHub: undefined
    })

    vi.mocked(addEthereumBridgeFees).mockResolvedValue(undefined)

    const res = await getXcmFeeInternal(createOptions())

    expect(res.failureChain).toBeUndefined()
    expect(res.failureReason).toBeUndefined()
  })

  it('handles case with no hops and traversal reaches destination successfully', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
    vi.mocked(getNativeAssetSymbol).mockReturnValue('GLMR')
    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')

    vi.mocked(getOriginXcmFeeInternal).mockResolvedValue({
      ...xcmFeeResultbase,
      feeType: 'dryRun',
      dryRunError: undefined,
      forwardedXcms: undefined,
      destParaId: undefined
    })

    vi.mocked(traverseXcmHops).mockResolvedValue({
      hops: [],
      lastProcessedChain: 'Acala',
      destination: {
        fee: 2_000n,
        feeType: 'dryRun',
        currency: 'GLMR',
        sufficient: true
      },
      assetHub: undefined,
      bridgeHub: undefined
    })

    vi.mocked(addEthereumBridgeFees).mockResolvedValue(undefined)

    const res = await getXcmFeeInternal(createOptions())

    expect(res.destination).toEqual({
      fee: 2_000n,
      feeType: 'dryRun',
      sufficient: true,
      currency: 'GLMR'
    })
  })

  it('handles convertToFeeDetail with all optional fields', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
    vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')
    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')

    vi.mocked(getOriginXcmFeeInternal).mockResolvedValue({
      ...xcmFeeResultbase,
      feeType: 'dryRun',
      dryRunError: undefined,
      forwardedXcms: undefined,
      destParaId: undefined
    })

    vi.mocked(traverseXcmHops).mockResolvedValue({
      hops: [
        {
          chain: 'AssetHubPolkadot',
          result: {
            fee: undefined,
            feeType: undefined,
            currency: 'DOT',
            sufficient: false,
            dryRunError: 'Some error'
          }
        }
      ],
      lastProcessedChain: 'AssetHubPolkadot',
      destination: undefined,
      assetHub: {
        fee: undefined,
        feeType: undefined,
        currency: 'DOT',
        sufficient: false,
        dryRunError: 'Some error'
      },
      bridgeHub: undefined
    })

    vi.mocked(addEthereumBridgeFees).mockResolvedValue(undefined)
    vi.mocked(getDestXcmFee).mockResolvedValue({
      ...xcmFeeResultbase,
      feeType: 'paymentInfo'
    })

    const res = await getXcmFeeInternal(createOptions())

    expect(res.hops[0].result).toEqual({
      currency: 'DOT',
      sufficient: false,
      dryRunError: 'Some error'
    })
    expect(res.assetHub).toEqual({
      currency: 'DOT',
      sufficient: false,
      dryRunError: 'Some error'
    })
  })

  it('handles API disconnect and clone operations', async () => {
    const mockCloneApi = {
      init: vi.fn().mockResolvedValue(undefined),
      setDisconnectAllowed: vi.fn(),
      disconnect: vi.fn().mockResolvedValue(undefined)
    }

    const mockApi = {
      setDisconnectAllowed: vi.fn(),
      disconnect: vi.fn().mockResolvedValue(undefined),
      clone: vi.fn().mockReturnValue(mockCloneApi)
    } as unknown as IPolkadotApi<unknown, unknown>

    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
    vi.mocked(getNativeAssetSymbol).mockReturnValue('GLMR')

    vi.mocked(getOriginXcmFeeInternal).mockResolvedValue({
      ...xcmFeeResultbase,
      feeType: 'paymentInfo',
      dryRunError: undefined,
      forwardedXcms: undefined,
      destParaId: undefined
    })

    vi.mocked(getDestXcmFee).mockResolvedValue({
      ...xcmFeeResultbase,
      feeType: 'paymentInfo'
    })

    const cloneSpy = vi.spyOn(mockApi, 'clone')

    await getXcmFeeInternal(createOptions({ api: mockApi }))

    expect(cloneSpy).toHaveBeenCalled()
    expect(mockCloneApi.init).toHaveBeenCalled()
    expect(mockCloneApi.setDisconnectAllowed).toHaveBeenCalledWith(false)
    expect(mockCloneApi.setDisconnectAllowed).toHaveBeenCalledWith(true)
    expect(mockCloneApi.disconnect).toHaveBeenCalled()
  })

  it('covers destination fallback when hops fail before reaching destination', async () => {
    const mockCloneApi = {
      init: vi.fn().mockResolvedValue(undefined),
      setDisconnectAllowed: vi.fn(),
      disconnect: vi.fn().mockResolvedValue(undefined)
    }

    const mockApi = {
      setDisconnectAllowed: vi.fn(),
      disconnect: vi.fn().mockResolvedValue(undefined),
      clone: vi.fn().mockReturnValue(mockCloneApi)
    } as unknown as IPolkadotApi<unknown, unknown>

    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({
      symbol: 'ACA'
    } as TAssetInfo)
    vi.mocked(getNativeAssetSymbol).mockImplementation((chain: string) => {
      if (chain === 'Acala') return 'ACA'
      if (chain === 'AssetHubPolkadot') return 'DOT'
      return 'GLMR'
    })
    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')

    vi.mocked(getOriginXcmFeeInternal).mockResolvedValue({
      ...xcmFeeResultbase,
      feeType: 'dryRun',
      dryRunError: undefined,
      forwardedXcms: [null, [{ key: 'value' }]],
      destParaId: 1000
    })

    vi.mocked(traverseXcmHops).mockResolvedValue({
      hops: [
        {
          chain: 'AssetHubPolkadot',
          result: {
            fee: 2_000n,
            feeType: 'dryRun',
            currency: 'DOT',
            dryRunError: 'Failed at AssetHub'
          }
        }
      ],
      lastProcessedChain: 'AssetHubPolkadot',
      destination: undefined,
      assetHub: {
        fee: 2_000n,
        feeType: 'dryRun',
        currency: 'DOT',
        dryRunError: 'Failed at AssetHub'
      },
      bridgeHub: undefined
    })

    vi.mocked(addEthereumBridgeFees).mockResolvedValue(undefined)

    vi.mocked(getDestXcmFee).mockResolvedValue({
      ...xcmFeeResultbase,
      feeType: 'paymentInfo',
      sufficient: false
    })

    const res = await getXcmFeeInternal(createOptions({ api: mockApi }))

    expect(getDestXcmFee).toHaveBeenCalledTimes(1)
    expect(mockCloneApi.init).toHaveBeenCalledWith('Moonbeam', expect.any(Number))

    expect(res.destination).toEqual({
      fee: 1_000n,
      feeType: 'paymentInfo',
      sufficient: false,
      currency: 'GLMR',
      asset: {
        symbol: 'ACA'
      }
    })
  })

  it('covers Ethereum destination does not init API', async () => {
    const mockCloneApi = {
      init: vi.fn().mockResolvedValue(undefined),
      setDisconnectAllowed: vi.fn(),
      disconnect: vi.fn().mockResolvedValue(undefined)
    }

    const mockApi = {
      setDisconnectAllowed: vi.fn(),
      disconnect: vi.fn().mockResolvedValue(undefined),
      clone: vi.fn().mockReturnValue(mockCloneApi)
    } as unknown as IPolkadotApi<unknown, unknown>

    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
    vi.mocked(getNativeAssetSymbol).mockReturnValue('ETH')
    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')

    vi.mocked(getOriginXcmFeeInternal).mockResolvedValue({
      ...xcmFeeResultbase,
      feeType: 'dryRun',
      dryRunError: undefined,
      forwardedXcms: [null, [{ key: 'value' }]],
      destParaId: 1000
    })

    vi.mocked(traverseXcmHops).mockResolvedValue({
      hops: [
        {
          chain: 'BridgeHubPolkadot',
          result: {
            fee: 2_000n,
            feeType: 'dryRun',
            currency: 'DOT',
            dryRunError: 'Failed at BridgeHub'
          }
        }
      ],
      lastProcessedChain: 'BridgeHubPolkadot',
      destination: undefined,
      assetHub: undefined,
      bridgeHub: {
        fee: 2_000n,
        feeType: 'dryRun',
        currency: 'DOT',
        dryRunError: 'Failed at BridgeHub'
      }
    })

    vi.mocked(addEthereumBridgeFees).mockResolvedValue(undefined)

    vi.mocked(getDestXcmFee).mockResolvedValue({
      ...xcmFeeResultbase,
      feeType: 'noFeeRequired'
    })

    await getXcmFeeInternal(
      createOptions({
        api: mockApi,
        destination: 'Ethereum'
      })
    )

    expect(mockCloneApi.init).not.toHaveBeenCalled()
  })

  it('covers processHop currency logic: destination equals currentChain', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
    vi.mocked(findAssetOnDestOrThrow).mockReturnValue({ symbol: 'MAPPED_ACA' } as TAssetInfo)
    vi.mocked(getNativeAssetSymbol).mockReturnValue('GLMR')
    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')

    vi.mocked(getOriginXcmFeeInternal).mockResolvedValue({
      ...xcmFeeResultbase,
      feeType: 'dryRun',
      dryRunError: undefined,
      forwardedXcms: [null, [{ key: 'value' }]],
      destParaId: 1000
    })

    let capturedProcessHop: (params: HopProcessParams<unknown, unknown>) => Promise<unknown>
    vi.mocked(traverseXcmHops).mockImplementation(async params => {
      capturedProcessHop = params.processHop

      const hopResult = await capturedProcessHop({
        api: mockApi,
        currentChain: 'Moonbeam',
        currentOrigin: 'Acala',
        currentAsset: { symbol: 'ACA' } as TAssetInfo,
        forwardedXcms: [null, [{ key: 'value' }]],
        hasPassedExchange: false
      } as HopProcessParams<unknown, unknown>)

      return {
        hops: [
          {
            chain: 'Moonbeam',
            result: hopResult
          }
        ],
        lastProcessedChain: 'Moonbeam',
        destination: hopResult,
        assetHub: undefined,
        bridgeHub: undefined
      }
    })

    vi.mocked(getDestXcmFee).mockResolvedValue({
      ...xcmFeeResultbase,
      feeType: 'dryRun',
      sufficient: true
    })

    vi.mocked(addEthereumBridgeFees).mockResolvedValue(undefined)

    const mockApi = createOptions().api

    const res = await getXcmFeeInternal(createOptions())

    expect(findAssetOnDestOrThrow).toHaveBeenCalledWith('Acala', 'Moonbeam', 'ACA')
    expect(res.destination.currency).toBe('MAPPED_ACA')
  })

  it('covers processHop currency logic: hasPassedExchange with swapConfig', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
    vi.mocked(findAssetOnDestOrThrow).mockReturnValue({ symbol: 'USDT' } as TAssetInfo)
    vi.mocked(getNativeAssetSymbol).mockReturnValue('GLMR')
    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')

    vi.mocked(getOriginXcmFeeInternal).mockResolvedValue({
      ...xcmFeeResultbase,
      feeType: 'dryRun',
      dryRunError: undefined,
      forwardedXcms: [null, [{ key: 'value' }]],
      destParaId: 1000
    })

    let capturedProcessHop: (params: HopProcessParams<unknown, unknown>) => Promise<unknown>
    vi.mocked(traverseXcmHops).mockImplementation(async params => {
      capturedProcessHop = params.processHop

      const hopResult = await capturedProcessHop({
        api: mockApi,
        currentChain: 'Moonbeam',
        currentOrigin: 'Hydration',
        currentAsset: { symbol: 'ACA' } as TAssetInfo,
        forwardedXcms: [null, [{ key: 'value' }]],
        hasPassedExchange: true
      } as HopProcessParams<unknown, unknown>)

      return {
        hops: [
          {
            chain: 'Moonbeam',
            result: hopResult
          }
        ],
        lastProcessedChain: 'Moonbeam',
        destination: hopResult,
        assetHub: undefined,
        bridgeHub: undefined
      }
    })

    vi.mocked(getDestXcmFee).mockResolvedValue({
      ...xcmFeeResultbase,
      feeType: 'dryRun',
      sufficient: true
    })

    vi.mocked(addEthereumBridgeFees).mockResolvedValue(undefined)

    const mockApi = createOptions().api

    await getXcmFeeInternal(
      createOptions({
        swapConfig: {
          exchangeChain: 'Hydration',
          currencyTo: { symbol: 'USDT' }
        }
      })
    )

    expect(findAssetOnDestOrThrow).toHaveBeenCalledWith('Hydration', 'Moonbeam', {
      symbol: 'USDT'
    })
  })

  it('test bridgeHub fee update when fees differ', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
    vi.mocked(getNativeAssetSymbol).mockImplementation((chain: string) => {
      if (chain === 'BridgeHubPolkadot') return 'DOT'
      return 'ACA'
    })
    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')

    vi.mocked(getOriginXcmFeeInternal).mockResolvedValue({
      ...xcmFeeResultbase,
      feeType: 'dryRun',
      dryRunError: undefined,
      forwardedXcms: [null, [{ key: 'value' }]],
      destParaId: 1000
    })

    const originalBridgeHubResult = {
      fee: 2_000n,
      feeType: 'paymentInfo' as const,
      currency: 'DOT'
    }

    vi.mocked(traverseXcmHops).mockResolvedValue({
      hops: [
        {
          chain: 'BridgeHubPolkadot',
          result: originalBridgeHubResult
        }
      ],
      lastProcessedChain: 'BridgeHubPolkadot',
      destination: undefined,
      assetHub: undefined,
      bridgeHub: originalBridgeHubResult
    })

    const updatedBridgeHubResult = {
      fee: 5_000n,
      feeType: 'paymentInfo' as const,
      currency: 'DOT'
    }
    vi.mocked(addEthereumBridgeFees).mockResolvedValue(updatedBridgeHubResult)

    const res = await getXcmFeeInternal(createOptions())

    expect(res.hops[0].result.fee).toBe(5_000n)
    expect(res.bridgeHub?.fee).toBe(5_000n)
  })

  it('handles processHop currency logic: Ethereum destination with AssetHub hop', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({ symbol: 'DOT' } as TAssetInfo)
    vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')
    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')

    vi.mocked(getOriginXcmFeeInternal).mockResolvedValue({
      ...xcmFeeResultbase,
      feeType: 'dryRun',
      dryRunError: undefined,
      forwardedXcms: [null, [{ key: 'value' }]],
      destParaId: 1000
    })

    let capturedProcessHop: (params: HopProcessParams<unknown, unknown>) => Promise<unknown>
    vi.mocked(traverseXcmHops).mockImplementation(async params => {
      capturedProcessHop = params.processHop

      const hopResult = await capturedProcessHop({
        api: createOptions().api,
        currentChain: 'AssetHubPolkadot',
        currentOrigin: 'Acala',
        currentAsset: { symbol: 'ACA' } as TAssetInfo,
        forwardedXcms: [null, [{ key: 'value' }]],
        hasPassedExchange: false
      } as HopProcessParams<unknown, unknown>)

      return {
        hops: [],
        lastProcessedChain: 'AssetHubPolkadot',
        destination: undefined,
        assetHub: hopResult,
        bridgeHub: undefined
      }
    })

    vi.mocked(getDestXcmFee).mockResolvedValue({
      ...xcmFeeResultbase,
      feeType: 'dryRun'
    })

    vi.mocked(addEthereumBridgeFees).mockResolvedValue(undefined)

    await getXcmFeeInternal(createOptions({ destination: 'Ethereum' }))

    expect(getNativeAssetSymbol).toHaveBeenCalledWith('Ethereum')
  })
})

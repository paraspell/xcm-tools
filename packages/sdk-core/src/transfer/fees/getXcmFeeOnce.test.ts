import type { TAssetInfo } from '@paraspell/assets'
import {
  findAssetInfoOrThrow,
  findAssetOnDestOrThrow,
  findNativeAssetInfoOrThrow
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
import { getMythosOriginFee } from '../../utils/fees/getMythosOriginFee'
import { addEthereumBridgeFees, traverseXcmHops } from '../dry-run'
import { getDestXcmFee } from './getDestXcmFee'
import { getOriginXcmFeeInternal } from './getOriginXcmFeeInternal'
import { getXcmFeeOnce } from './getXcmFeeOnce'

vi.mock('@paraspell/assets')
vi.mock('@paraspell/sdk-common', async importActual => ({
  ...(await importActual()),
  isRelayChain: vi.fn().mockReturnValue(false)
}))

vi.mock('../../chains/getTChain')
vi.mock('../../utils')
vi.mock('../utils/resolveHopAsset')
vi.mock('../dry-run')
vi.mock('./getOriginXcmFeeInternal')
vi.mock('./getDestXcmFee')

vi.mock('../../utils/fees/getMythosOriginFee')

const createOptions = (overrides?: Partial<TGetXcmFeeOptions<unknown, unknown, unknown>>) =>
  ({
    api: {
      setDisconnectAllowed: vi.fn(),
      disconnect: vi.fn().mockResolvedValue(undefined),
      clone: vi.fn().mockImplementation(() => createOptions(overrides).api),
      init: vi.fn().mockResolvedValue(undefined),
      getApi: vi.fn().mockReturnValue({ disconnect: vi.fn() })
    } as unknown as IPolkadotApi<unknown, unknown, unknown>,
    builder: {} as unknown,
    origin: 'Acala',
    destination: 'Moonbeam',
    senderAddress: '5Alice',
    address: '5Bob',
    currency: 'ACA',
    useRootOrigin: false,
    ...overrides
  }) as unknown as TGetXcmFeeInternalOptions<unknown, unknown, unknown>

describe('getXcmFeeOnce', () => {
  const xcmFeeResCurrency = {
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

    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({ symbol: 'GLMR' } as TAssetInfo)

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

    const res = await getXcmFeeOnce(createOptions())

    expect(res).toEqual({
      failureReason: 'Simulation failed',
      failureChain: 'origin',
      origin: {
        fee: 1_000n,
        feeType: 'paymentInfo',
        asset: { symbol: 'ACA', decimals: 12 },
        dryRunError: 'Simulation failed'
      },
      hops: [],
      destination: {
        fee: 2_000n,
        feeType: 'paymentInfo',
        asset: { symbol: 'GLMR' }
      }
    })
  })

  it('Mythos → Ethereum: adds origin surcharge and does NOT call addEthereumBridgeFees', async () => {
    vi.mocked(getMythosOriginFee).mockResolvedValue(500n)

    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'MYTH', decimals: 18 } as TAssetInfo)
    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({ symbol: 'ETH' } as TAssetInfo)
    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({ symbol: 'ETH' } as TAssetInfo)

    vi.mocked(getOriginXcmFeeInternal).mockResolvedValue({
      fee: 1000n,
      feeType: 'dryRun',
      dryRunError: undefined,
      forwardedXcms: [null, [{}]],
      destParaId: 1000,
      asset: { symbol: 'MYTH' } as TAssetInfo
    })

    vi.mocked(traverseXcmHops).mockResolvedValue({
      hops: [],
      lastProcessedChain: 'Mythos'
    })

    const bridgeSpy = vi.mocked(addEthereumBridgeFees)

    const res = await getXcmFeeOnce(
      createOptions({
        origin: 'Mythos',
        destination: 'Ethereum',
        currency: { symbol: 'MYTH', amount: 1_000n }
      })
    )

    expect(res.origin.fee).toBe(1500n)

    expect(res.destination).toMatchObject({
      fee: 0n,
      feeType: 'noFeeRequired',
      asset: { symbol: 'ETH' }
    })

    expect(bridgeSpy).not.toHaveBeenCalled()
  })

  it('returns correct structure when origin does not support dry-run, returns paymentInfo, destination should also use paymentInfo', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)

    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({ symbol: 'GLMR' } as TAssetInfo)

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

    const res = await getXcmFeeOnce(createOptions())

    expect(res).toEqual({
      origin: {
        fee: 1_000n,
        feeType: 'paymentInfo',
        asset: { symbol: 'ACA', decimals: 12 }
      },
      hops: [],
      destination: {
        fee: 2_000n,
        feeType: 'paymentInfo',
        asset: { symbol: 'GLMR' }
      }
    })
  })

  it('computes fees when origin simulation succeeds and no hops are needed', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)

    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({ symbol: 'GLMR' } as TAssetInfo)

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
      lastProcessedChain: 'Acala'
    })

    vi.mocked(addEthereumBridgeFees).mockResolvedValue(undefined)

    const res = await getXcmFeeOnce(createOptions())

    expect(getDestXcmFee).not.toHaveBeenCalled()

    expect(res).toEqual({
      origin: {
        fee: 1_000n,
        feeType: 'dryRun',
        asset: { symbol: 'ACA', decimals: 12 }
      },
      hops: [],
      destination: {
        fee: 0n,
        feeType: 'noFeeRequired',
        sufficient: true,
        asset: { symbol: 'GLMR' }
      }
    })
  })

  it('adds intermediate AssetHub fee when hop succeeds', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)

    vi.mocked(findNativeAssetInfoOrThrow).mockImplementation(chain => {
      if (chain === 'AssetHubPolkadot') return { symbol: 'DOT' } as TAssetInfo
      return { symbol: 'GLMR' } as TAssetInfo
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
            asset: { symbol: 'DOT' }
          }
        }
      ],
      lastProcessedChain: 'AssetHubPolkadot'
    })

    vi.mocked(addEthereumBridgeFees).mockResolvedValue(undefined)

    const res = await getXcmFeeOnce(createOptions())

    expect(res).toEqual({
      origin: {
        fee: 1_000n,
        feeType: 'dryRun',
        asset: { symbol: 'ACA', decimals: 12 }
      },
      hops: [
        {
          chain: 'AssetHubPolkadot',
          result: {
            fee: 3_000n,
            feeType: 'paymentInfo',
            asset: { symbol: 'DOT' }
          }
        }
      ],
      destination: {
        fee: 0n,
        feeType: 'noFeeRequired',
        sufficient: true,
        asset: { symbol: 'GLMR' }
      }
    })
  })

  it('handles hop dry-run error and falls back to destination paymentInfo', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)

    vi.mocked(findNativeAssetInfoOrThrow).mockImplementation(chain => {
      if (chain === 'AssetHubPolkadot') return { symbol: 'DOT' } as TAssetInfo
      return { symbol: 'GLMR' } as TAssetInfo
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
            asset: { symbol: 'DOT' },
            dryRunError: 'Hop failed'
          }
        }
      ],
      lastProcessedChain: 'AssetHubPolkadot'
    })

    vi.mocked(addEthereumBridgeFees).mockResolvedValue(undefined)

    vi.mocked(getDestXcmFee).mockResolvedValue({
      asset: { symbol: 'GLMR', decimals: 12 } as TAssetInfo,
      fee: 2_000n,
      feeType: 'paymentInfo'
    })

    const res = await getXcmFeeOnce(createOptions())

    expect(getDestXcmFee).toHaveBeenCalledTimes(1)

    expect(res).toEqual({
      failureReason: 'Hop failed',
      failureChain: 'AssetHubPolkadot',
      origin: {
        fee: 1_000n,
        feeType: 'dryRun',
        asset: { symbol: 'ACA', decimals: 12 }
      },
      hops: [
        {
          chain: 'AssetHubPolkadot',
          result: {
            fee: 3_000n,
            feeType: 'paymentInfo',
            asset: { symbol: 'DOT' },
            dryRunError: 'Hop failed'
          }
        }
      ],
      destination: {
        fee: 2_000n,
        feeType: 'paymentInfo',
        sufficient: undefined,
        asset: { symbol: 'GLMR' }
      }
    })
  })

  it('handles multiple hops including AssetHub and BridgeHub', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
    vi.mocked(findNativeAssetInfoOrThrow).mockImplementation(chain => {
      if (chain === 'Acala') return { symbol: 'ACA' } as TAssetInfo
      if (chain === 'AssetHubPolkadot') return { symbol: 'DOT' } as TAssetInfo
      if (chain === 'BridgeHubPolkadot') return { symbol: 'DOT' } as TAssetInfo
      return { symbol: 'GLMR' } as TAssetInfo
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
            fee: 3000n,
            feeType: 'dryRun',
            asset: { symbol: 'ACA' },
            sufficient: true
          }
        },
        {
          chain: 'BridgeHubPolkadot',
          result: {
            fee: 4000n,
            feeType: 'paymentInfo',
            asset: { symbol: 'DOT' },
            sufficient: false
          }
        }
      ],
      lastProcessedChain: 'BridgeHubPolkadot'
    })

    vi.mocked(addEthereumBridgeFees<unknown, unknown, unknown, TXcmFeeHopResult>).mockResolvedValue(
      {
        ...xcmFeeResultbase,
        feeType: 'paymentInfo',
        sufficient: false
      }
    )

    const res = await getXcmFeeOnce(createOptions())

    expect(res.hops).toHaveLength(2)
    expect(res.hops).toEqual([
      {
        chain: 'AssetHubPolkadot',
        result: {
          fee: 3000n,
          feeType: 'dryRun',
          asset: { symbol: 'ACA' },
          sufficient: true
        }
      },
      {
        chain: 'BridgeHubPolkadot',
        result: {
          fee: 1000n,
          feeType: 'paymentInfo',
          asset: { symbol: 'DOT' },
          sufficient: false
        }
      }
    ])

    expect(res.destination).toMatchObject({
      fee: 0n,
      feeType: 'noFeeRequired',
      sufficient: true,
      asset: { symbol: 'GLMR' }
    })
  })

  it('handles swapConfig with exchange chain in hop route - updates asset after exchange', async () => {
    const initialAsset = { symbol: 'ACA' } as TAssetInfo
    const swappedAsset = { symbol: 'USDT' } as TAssetInfo

    vi.mocked(findAssetInfoOrThrow).mockReturnValue(initialAsset)
    vi.mocked(findAssetOnDestOrThrow).mockReturnValue(swappedAsset)

    vi.mocked(findNativeAssetInfoOrThrow).mockImplementation(chain => {
      if (chain === 'Acala') return { symbol: 'ACA' } as TAssetInfo
      if (chain === 'AssetHubPolkadot') return { symbol: 'DOT' } as TAssetInfo
      if (chain === 'Hydration') return { symbol: 'HDX' } as TAssetInfo
      return { symbol: 'GLMR' } as TAssetInfo
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
            asset: { symbol: 'ACA' },
            sufficient: true
          }
        },
        {
          chain: 'Hydration',
          result: {
            fee: 3_000n,
            feeType: 'dryRun',
            asset: { symbol: 'ACA' },
            sufficient: true
          }
        }
      ],
      lastProcessedChain: 'Hydration',
      destination: {
        fee: 4_000n,
        feeType: 'dryRun',
        asset: { symbol: 'USDT' },
        sufficient: false
      }
    })

    vi.mocked(addEthereumBridgeFees).mockResolvedValue(undefined)

    const res = await getXcmFeeOnce(
      createOptions({
        swapConfig: {
          exchangeChain: 'Hydration',
          currencyTo: { symbol: 'USDT' },
          amountOut: 1_000_000n
        }
      })
    )

    expect(res.hops).toHaveLength(2)
    expect(res.hops[0]).toEqual({
      chain: 'AssetHubPolkadot',
      result: {
        fee: 2_000n,
        feeType: 'dryRun',
        asset: { symbol: 'ACA' },
        sufficient: true
      }
    })
    expect(res.hops[1]).toEqual({
      chain: 'Hydration',
      result: {
        fee: 3_000n,
        feeType: 'dryRun',
        asset: { symbol: 'ACA' },
        sufficient: true
      }
    })

    expect(res.destination).toMatchObject({
      fee: 4_000n,
      feeType: 'dryRun',
      asset: { symbol: 'USDT' },
      sufficient: false
    })
  })

  it('handles Ethereum as destination with noFeeRequired', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({ symbol: 'ETH' } as TAssetInfo)
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
      lastProcessedChain: 'Acala'
    })

    vi.mocked(addEthereumBridgeFees).mockResolvedValue(undefined)

    const res = await getXcmFeeOnce(createOptions({ destination: 'Ethereum' }))

    expect(res.destination).toMatchObject({
      fee: 0n,
      feeType: 'noFeeRequired',
      sufficient: true,
      asset: { symbol: 'ETH' }
    })
  })

  it('handles bridge hub fee updates after Ethereum bridge processing', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
    vi.mocked(findNativeAssetInfoOrThrow).mockImplementation(chain => {
      if (chain === 'BridgeHubPolkadot') return { symbol: 'DOT' } as TAssetInfo
      return { symbol: 'ACA' } as TAssetInfo
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
            fee: 1_000n,
            feeType: 'paymentInfo',
            asset: { symbol: 'DOT' }
          }
        }
      ],
      lastProcessedChain: 'BridgeHubPolkadot'
    })

    vi.mocked(addEthereumBridgeFees<unknown, unknown, unknown, TXcmFeeHopResult>).mockResolvedValue(
      {
        ...xcmFeeResultbase,
        feeType: 'paymentInfo'
      }
    )

    const res = await getXcmFeeOnce(createOptions({ destination: 'Ethereum' }))

    expect(res.hops[0].result.fee).toBe(1_000n)
  })

  it('handles sufficient field being undefined in origin fee', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
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
      lastProcessedChain: 'Acala'
    })

    vi.mocked(addEthereumBridgeFees).mockResolvedValue(undefined)

    const res = await getXcmFeeOnce(createOptions())

    expect(res.origin).not.toHaveProperty('sufficient')
  })

  it('handles weight field in origin fee', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
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
      lastProcessedChain: 'Acala'
    })

    vi.mocked(addEthereumBridgeFees).mockResolvedValue(undefined)

    const res = await getXcmFeeOnce(createOptions())

    expect(res.origin).toHaveProperty('weight')
    expect(res.origin.weight).toEqual({ refTime: 1000000n, proofSize: 5000n })
  })

  it('handles hop failure with different chain in failureChain detection', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
    vi.mocked(findNativeAssetInfoOrThrow).mockImplementation(chain => {
      if (chain === 'Acala') return { symbol: 'ACA' } as TAssetInfo
      if (chain === 'Altair') return { symbol: 'CUSTOM' } as TAssetInfo
      return { symbol: 'GLMR' } as TAssetInfo
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
            asset: { symbol: 'CUSTOM' },
            dryRunError: 'Custom chain failed'
          }
        }
      ],
      lastProcessedChain: 'Quartz'
    })

    vi.mocked(addEthereumBridgeFees).mockResolvedValue(undefined)
    vi.mocked(getDestXcmFee).mockResolvedValue({
      ...xcmFeeResultbase,
      feeType: 'paymentInfo'
    })

    const res = await getXcmFeeOnce(createOptions())

    expect(res.failureChain).toBe('Quartz')
    expect(res.failureReason).toBe('Custom chain failed')
  })

  it('handles destination dry run error in failureChain detection', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
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
        asset: { symbol: 'GLMR' },
        dryRunError: 'Destination failed'
      }
    })

    vi.mocked(addEthereumBridgeFees).mockResolvedValue(undefined)

    const res = await getXcmFeeOnce(createOptions())

    expect(res.failureChain).toBe('destination')
    expect(res.failureReason).toBe('Destination failed')
  })

  it('handles case where no failures occur', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
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
        asset: { symbol: 'GLMR' }
      }
    })

    vi.mocked(addEthereumBridgeFees).mockResolvedValue(undefined)

    const res = await getXcmFeeOnce(createOptions())

    expect(res.failureChain).toBeUndefined()
    expect(res.failureReason).toBeUndefined()
  })

  it('handles case with no hops and traversal reaches destination successfully', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({ symbol: 'GLMR' } as TAssetInfo)
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
        asset: { symbol: 'GLMR' },
        sufficient: true
      }
    })

    vi.mocked(addEthereumBridgeFees).mockResolvedValue(undefined)

    const res = await getXcmFeeOnce(createOptions())

    expect(res.destination).toEqual({
      fee: 2_000n,
      feeType: 'dryRun',
      sufficient: true,
      asset: { symbol: 'GLMR' }
    })
  })

  it('handles convertToFeeDetail with all optional fields', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({ symbol: 'DOT' } as TAssetInfo)
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
            asset: { symbol: 'DOT' },
            sufficient: false,
            dryRunError: 'Some error'
          }
        }
      ],
      lastProcessedChain: 'AssetHubPolkadot',
      destination: undefined
    })

    vi.mocked(addEthereumBridgeFees).mockResolvedValue(undefined)
    vi.mocked(getDestXcmFee).mockResolvedValue({
      ...xcmFeeResultbase,
      feeType: 'paymentInfo'
    })

    const res = await getXcmFeeOnce(createOptions())

    expect(res.hops[0].result).toEqual({
      asset: { symbol: 'DOT' },
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
    } as unknown as IPolkadotApi<unknown, unknown, unknown>

    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({ symbol: 'GLMR' } as TAssetInfo)

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

    await getXcmFeeOnce(createOptions({ api: mockApi }))

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
    } as unknown as IPolkadotApi<unknown, unknown, unknown>

    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
    vi.mocked(findNativeAssetInfoOrThrow).mockImplementation(chain => {
      if (chain === 'Acala') return { symbol: 'ACA' } as TAssetInfo
      if (chain === 'AssetHubPolkadot') return { symbol: 'DOT' } as TAssetInfo
      return { symbol: 'GLMR' } as TAssetInfo
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
            dryRunError: 'Failed at AssetHub'
          }
        }
      ],
      lastProcessedChain: 'AssetHubPolkadot'
    })

    vi.mocked(addEthereumBridgeFees).mockResolvedValue(undefined)

    vi.mocked(getDestXcmFee).mockResolvedValue({
      ...xcmFeeResultbase,
      feeType: 'paymentInfo',
      sufficient: false
    })

    const res = await getXcmFeeOnce(createOptions({ api: mockApi }))

    expect(getDestXcmFee).toHaveBeenCalledTimes(1)
    expect(mockCloneApi.init).toHaveBeenCalledWith('Moonbeam', expect.any(Number))

    expect(res.destination).toEqual({
      fee: 1_000n,
      feeType: 'paymentInfo',
      sufficient: false,
      asset: {
        symbol: 'GLMR'
      }
    })
  })

  it('covers processHop currency logic: destination equals currentChain', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
    vi.mocked(findAssetOnDestOrThrow).mockReturnValue({ symbol: 'MAPPED_ACA' } as TAssetInfo)
    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({ symbol: 'GLMR' } as TAssetInfo)
    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')

    vi.mocked(getOriginXcmFeeInternal).mockResolvedValue({
      ...xcmFeeResultbase,
      feeType: 'dryRun',
      dryRunError: undefined,
      forwardedXcms: [null, [{ key: 'value' }]],
      destParaId: 1000
    })

    let capturedProcessHop: (
      params: HopProcessParams<unknown, unknown, unknown>
    ) => Promise<unknown>
    vi.mocked(traverseXcmHops).mockImplementation(async params => {
      capturedProcessHop = params.processHop

      const hopResult = await capturedProcessHop({
        api: mockApi,
        currentChain: 'Moonbeam',
        currentOrigin: 'Acala',
        currentAsset: { symbol: 'ACA' } as TAssetInfo,
        forwardedXcms: [null, [{ key: 'value' }]],
        hasPassedExchange: false
      } as HopProcessParams<unknown, unknown, unknown>)

      return {
        hops: [
          {
            chain: 'Moonbeam',
            result: hopResult
          }
        ],
        lastProcessedChain: 'Moonbeam',
        destination: hopResult
      }
    })

    vi.mocked(getDestXcmFee).mockResolvedValue({
      ...xcmFeeResultbase,
      feeType: 'dryRun',
      sufficient: true
    })

    vi.mocked(addEthereumBridgeFees).mockResolvedValue(undefined)

    const mockApi = createOptions().api

    const res = await getXcmFeeOnce(createOptions())

    expect(res.destination.asset).toEqual({ symbol: 'ACA', decimals: 12 })
  })

  it('covers processHop currency logic: hasPassedExchange with swapConfig', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
    vi.mocked(findAssetOnDestOrThrow).mockReturnValue({ symbol: 'USDT' } as TAssetInfo)
    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({ symbol: 'GLMR' } as TAssetInfo)
    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')

    vi.mocked(getOriginXcmFeeInternal).mockResolvedValue({
      ...xcmFeeResultbase,
      feeType: 'dryRun',
      dryRunError: undefined,
      forwardedXcms: [null, [{ key: 'value' }]],
      destParaId: 1000
    })

    let capturedProcessHop: (
      params: HopProcessParams<unknown, unknown, unknown>
    ) => Promise<unknown>
    vi.mocked(traverseXcmHops).mockImplementation(async params => {
      capturedProcessHop = params.processHop

      const hopResult = await capturedProcessHop({
        api: mockApi,
        currentChain: 'Moonbeam',
        currentOrigin: 'Hydration',
        currentAsset: { symbol: 'ACA' } as TAssetInfo,
        forwardedXcms: [null, [{ key: 'value' }]],
        hasPassedExchange: true
      } as HopProcessParams<unknown, unknown, unknown>)

      return {
        hops: [
          {
            chain: 'Moonbeam',
            result: hopResult
          }
        ],
        lastProcessedChain: 'Moonbeam',
        destination: hopResult
      }
    })

    vi.mocked(getDestXcmFee).mockResolvedValue({
      ...xcmFeeResultbase,
      feeType: 'dryRun',
      sufficient: true
    })

    vi.mocked(addEthereumBridgeFees).mockResolvedValue(undefined)

    const mockApi = createOptions().api

    await getXcmFeeOnce(
      createOptions({
        swapConfig: {
          exchangeChain: 'Hydration',
          currencyTo: { symbol: 'USDT' },
          amountOut: 1_000_000n
        }
      })
    )
  })

  it('test bridgeHub fee update when fees differ', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
    vi.mocked(findNativeAssetInfoOrThrow).mockImplementation(chain => {
      if (chain === 'BridgeHubPolkadot') return { symbol: 'DOT' } as TAssetInfo
      return { symbol: 'ACA' } as TAssetInfo
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
      asset: { symbol: 'DOT' }
    }

    vi.mocked(traverseXcmHops).mockResolvedValue({
      hops: [
        {
          chain: 'BridgeHubPolkadot',
          result: originalBridgeHubResult
        }
      ],
      lastProcessedChain: 'BridgeHubPolkadot'
    })

    const updatedBridgeHubResult = {
      fee: 5_000n,
      feeType: 'paymentInfo' as const,
      asset: { symbol: 'DOT' }
    }
    vi.mocked(addEthereumBridgeFees).mockResolvedValue(updatedBridgeHubResult)

    const res = await getXcmFeeOnce(createOptions())

    expect(res.hops[0].result.fee).toBe(5_000n)
  })

  it('handles processHop currency logic: Ethereum destination with AssetHub hop', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({ symbol: 'DOT' } as TAssetInfo)
    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')

    vi.mocked(getOriginXcmFeeInternal).mockResolvedValue({
      ...xcmFeeResultbase,
      feeType: 'dryRun',
      dryRunError: undefined,
      forwardedXcms: [null, [{ key: 'value' }]],
      destParaId: 1000
    })

    let capturedProcessHop: (
      params: HopProcessParams<unknown, unknown, unknown>
    ) => Promise<unknown>
    vi.mocked(traverseXcmHops).mockImplementation(async params => {
      capturedProcessHop = params.processHop

      const hopResult = await capturedProcessHop({
        api: createOptions().api,
        currentChain: 'AssetHubPolkadot',
        currentOrigin: 'Acala',
        currentAsset: { symbol: 'ACA' } as TAssetInfo,
        forwardedXcms: [null, [{ key: 'value' }]],
        hasPassedExchange: false
      } as HopProcessParams<unknown, unknown, unknown>)

      return {
        hops: [
          {
            chain: 'AssetHubPolkadot',
            result: hopResult
          }
        ],
        lastProcessedChain: 'AssetHubPolkadot'
      }
    })

    vi.mocked(getDestXcmFee).mockResolvedValue({
      ...xcmFeeResultbase,
      feeType: 'dryRun'
    })

    vi.mocked(addEthereumBridgeFees).mockResolvedValue(undefined)

    await getXcmFeeOnce(createOptions({ destination: 'Ethereum' }))

    expect(findNativeAssetInfoOrThrow).toHaveBeenCalledWith('Ethereum')
  })
})

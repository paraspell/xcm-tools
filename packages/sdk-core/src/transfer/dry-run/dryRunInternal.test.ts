import type { TAssetInfo } from '@paraspell/assets'
import {
  findAssetInfoOnDest,
  findAssetInfoOrThrow,
  findAssetOnDestOrThrow,
  findNativeAssetInfoOrThrow,
  getNativeAssetSymbol,
  hasDryRunSupport
} from '@paraspell/assets'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import type { HopProcessParams, HopTraversalResult, TDryRunOptions } from '../../types'
import { getRelayChainOf } from '../../utils'
import { getMythosOriginFee } from '../../utils/fees/getMythosOriginFee'
import { dryRunInternal } from './dryRunInternal'
import { addEthereumBridgeFees, traverseXcmHops } from './traverseXcmHops'

vi.mock('@paraspell/assets')
vi.mock('@paraspell/sdk-common', async importOriginal => ({
  ...(await importOriginal<typeof import('@paraspell/sdk-common')>()),
  isRelayChain: vi.fn().mockReturnValue(false)
}))

vi.mock('../../utils/fees/getMythosOriginFee')

vi.mock('../../chains/getTChain')
vi.mock('../../utils')
vi.mock('../utils/resolveFeeAsset')
vi.mock('./traverseXcmHops')
vi.mock('../fees/getDestXcmFee', () => ({
  createOriginLocation: vi.fn().mockReturnValue({})
}))

const createFakeApi = (originDryRun: unknown) =>
  ({
    setDisconnectAllowed: vi.fn(),
    disconnect: vi.fn().mockResolvedValue(undefined),
    getApi: vi.fn().mockReturnValue({ disconnect: vi.fn() }),
    getDryRunCall: vi.fn().mockResolvedValue(originDryRun),
    clone: vi.fn().mockImplementation(() => ({
      init: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      getApi: vi.fn().mockReturnValue({}),
      getDryRunXcm: vi.fn()
    }))
  }) as unknown as IPolkadotApi<unknown, unknown>

const createOptions = (
  api: IPolkadotApi<unknown, unknown>,
  overrides?: Partial<TDryRunOptions<unknown, unknown>>
) =>
  ({
    api,
    tx: {} as unknown,
    origin: 'Acala',
    destination: 'Moonbeam',
    senderAddress: '5Alice',
    currency: { symbol: 'ACA', amount: 1_000n },
    ...overrides
  }) as unknown as TDryRunOptions<unknown, unknown>

afterEach(() => vi.resetAllMocks())

describe('dryRunInternal', () => {
  it('returns only origin result when origin dry-run fails', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)

    const originFail = { success: false, failureReason: 'someError' }
    const api = createFakeApi(originFail)

    const res = await dryRunInternal(createOptions(api))

    expect(res).toEqual({
      failureReason: 'someError',
      failureChain: 'origin',
      origin: originFail,
      hops: []
    })
  })

  it('origin & destination succeed (no intermediates)', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
    vi.mocked(getNativeAssetSymbol).mockReturnValue('ACA')
    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')
    vi.mocked(addEthereumBridgeFees).mockResolvedValue(undefined)

    const originOk = {
      success: true,
      fee: 1_000n,
      forwardedXcms: [null, [{ value: [1] }]],
      destParaId: 2000,
      currency: 'ACA',
      asset: { symbol: 'ACA' } as TAssetInfo
    }

    vi.mocked(traverseXcmHops).mockResolvedValue({
      hops: [],
      destination: {
        success: true,
        fee: 2_000n,
        currency: 'ACA'
      }
    })

    const api = createFakeApi(originOk)
    const res = await dryRunInternal(createOptions(api))

    expect(res).toEqual({
      origin: { ...originOk, currency: 'ACA' },
      destination: { success: true, fee: 2_000n, currency: 'ACA' },
      hops: []
    })
  })

  it('Mythos → Ethereum: adds origin surcharge and passes it to hop dry run', async () => {
    vi.mocked(getMythosOriginFee).mockResolvedValue(500n)
    vi.mocked(hasDryRunSupport).mockReturnValue(true)
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'MYTH', decimals: 18 } as TAssetInfo)

    const originOk = {
      success: true,
      fee: 1_000n,
      forwardedXcms: [null, [[{ dummy: 'xcm' }]]],
      destParaId: 1000,
      currency: 'MYTH',
      asset: { symbol: 'MYTH' } as TAssetInfo
    }

    const getDryRunXcmSpy = vi.fn().mockResolvedValue({ success: true, fee: 2_000n })

    let capturedProcessHop: (p: HopProcessParams<unknown, unknown>) => Promise<unknown>
    vi.mocked(traverseXcmHops).mockImplementation(async params => {
      capturedProcessHop = params.processHop

      const mockHopApi = {
        getDryRunXcm: getDryRunXcmSpy
      } as unknown as IPolkadotApi<unknown, unknown>

      const hopResult = await capturedProcessHop({
        api: mockHopApi,
        currentChain: 'AssetHubPolkadot',
        currentOrigin: 'Mythos',
        currentAsset: { symbol: 'MYTH' } as TAssetInfo,
        forwardedXcms: originOk.forwardedXcms,
        hasPassedExchange: false,
        isDestination: false
      } as HopProcessParams<unknown, unknown>)

      return {
        hops: [{ chain: 'AssetHubPolkadot', result: hopResult }],
        assetHub: hopResult
      } as unknown as HopTraversalResult<unknown>
    })

    const api = createFakeApi(originOk)
    const res = await dryRunInternal(
      createOptions(api, {
        origin: 'Mythos',
        destination: 'Ethereum',
        currency: { symbol: 'MYTH', amount: 1_000n }
      })
    )

    if (res.origin.success) {
      expect(res.origin.fee).toBe(1500n)
    }

    expect(getDryRunXcmSpy).toHaveBeenCalledTimes(1)
  })

  it('adds intermediate AssetHub result when hop succeeds', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({
      symbol: 'DOT'
    } as TAssetInfo)
    vi.mocked(getNativeAssetSymbol).mockImplementation(chain => {
      if (chain === 'AssetHubPolkadot') return 'DOT'
      return 'ACA'
    })
    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')
    vi.mocked(addEthereumBridgeFees).mockResolvedValue(undefined)

    const originOk = {
      success: true,
      fee: 1_000n,
      forwardedXcms: [null, [{ value: [1] }]],
      destParaId: 1000,
      currency: 'ACA',
      asset: { symbol: 'ACA' } as TAssetInfo
    }

    vi.mocked(traverseXcmHops).mockResolvedValue({
      hops: [
        {
          chain: 'AssetHubPolkadot',
          result: { success: true, fee: 3_000n, currency: 'ACA' }
        }
      ],
      assetHub: { success: true, fee: 3_000n, currency: 'ACA' },
      destination: { success: true, fee: 4_000n, currency: 'ACA' }
    })

    const api = createFakeApi(originOk)
    const res = await dryRunInternal(createOptions(api))

    expect(res).toEqual({
      origin: { ...originOk, currency: 'ACA', asset: { symbol: 'ACA' } },
      assetHub: {
        success: true,
        fee: 3_000n,
        currency: 'ACA'
      },
      destination: { success: true, fee: 4_000n, currency: 'ACA' },
      hops: [
        {
          chain: 'AssetHubPolkadot',
          result: { success: true, fee: 3_000n, currency: 'ACA' }
        }
      ]
    })
  })

  it('keeps failing destination result when last hop errors', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
    vi.mocked(getNativeAssetSymbol).mockReturnValue('ACA')
    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')
    vi.mocked(addEthereumBridgeFees).mockResolvedValue(undefined)

    const originOk = {
      success: true,
      fee: 1_000n,
      forwardedXcms: [null, [{ value: [1] }]],
      destParaId: 2000,
      currency: 'ACA',
      asset: { symbol: 'ACA' } as TAssetInfo
    }

    vi.mocked(traverseXcmHops).mockResolvedValue({
      hops: [],
      destination: { success: false, failureReason: 'dest-boom' }
    })

    const api = createFakeApi(originOk)
    const res = await dryRunInternal(createOptions(api))

    expect(res).toEqual({
      failureReason: 'dest-boom',
      failureChain: 'destination',
      origin: { ...originOk, currency: 'ACA' },
      destination: { success: false, failureReason: 'dest-boom' },
      hops: []
    })
  })

  it('handles swapConfig with exchange chain routing and asset transformation', async () => {
    const initialAsset = { symbol: 'ACA' } as TAssetInfo
    const swappedAsset = { symbol: 'USDT' } as TAssetInfo

    vi.mocked(findAssetInfoOrThrow).mockReturnValue(initialAsset)
    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({ symbol: 'DOT' } as TAssetInfo)
    vi.mocked(findAssetOnDestOrThrow).mockReturnValue(swappedAsset)
    vi.mocked(getNativeAssetSymbol).mockImplementation(chain => {
      if (chain === 'AssetHubPolkadot') return 'DOT'
      if (chain === 'BridgeHubPolkadot') return 'DOT'
      return 'ACA'
    })
    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')
    vi.mocked(addEthereumBridgeFees).mockResolvedValue(undefined)

    const originOk = {
      success: true,
      fee: 1_000n,
      forwardedXcms: [null, [{ value: [1] }]],
      destParaId: 1000,
      currency: 'ACA',
      asset: initialAsset
    }

    vi.mocked(traverseXcmHops).mockResolvedValue({
      hops: [
        {
          chain: 'AssetHubPolkadot',
          result: { success: true, fee: 2_000n, currency: 'ACA' }
        },
        {
          chain: 'Hydration',
          result: { success: true, fee: 3_000n, currency: 'ACA' }
        }
      ],
      assetHub: { success: true, fee: 2_000n, currency: 'ACA' },
      destination: { success: true, fee: 4_000n, currency: 'ACA' }
    })

    const api = createFakeApi(originOk)
    const res = await dryRunInternal(
      createOptions(api, {
        swapConfig: {
          exchangeChain: 'Hydration',
          currencyTo: { symbol: 'USDT' }
        }
      })
    )

    expect(res).toEqual({
      origin: { ...originOk, currency: 'ACA' },
      assetHub: {
        success: true,
        fee: 2_000n,
        currency: 'ACA'
      },
      destination: { success: true, fee: 4_000n, currency: 'ACA' },
      hops: [
        {
          chain: 'AssetHubPolkadot',
          result: { success: true, fee: 2_000n, currency: 'ACA' }
        },
        {
          chain: 'Hydration',
          result: { success: true, fee: 3_000n, currency: 'ACA' }
        }
      ]
    })
  })

  describe('dryRunInternal - Additional Coverage', () => {
    it('handles processHop when chain does not support dry run', async () => {
      vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
      vi.mocked(getNativeAssetSymbol).mockReturnValue('ACA')
      vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')
      vi.mocked(hasDryRunSupport).mockReturnValue(false)
      vi.mocked(addEthereumBridgeFees).mockResolvedValue(undefined)

      const originOk = {
        success: true,
        fee: 1_000n,
        forwardedXcms: [null, [{ value: [1] }]],
        destParaId: 1000
      }

      let capturedProcessHop: (params: HopProcessParams<unknown, unknown>) => Promise<unknown>
      vi.mocked(traverseXcmHops).mockImplementation(async params => {
        capturedProcessHop = params.processHop

        const hopResult = await capturedProcessHop({
          api: createFakeApi(originOk),
          currentChain: 'Quartz',
          currentOrigin: 'Acala',
          currentAsset: { symbol: 'ACA' } as TAssetInfo,
          forwardedXcms: [null, [{ value: [1] }]],
          hasPassedExchange: false,
          isDestination: false
        } as HopProcessParams<unknown, unknown>)

        return {
          hops: [
            {
              chain: 'UnsupportedChain',
              result: hopResult
            }
          ],
          destination: undefined
        } as unknown as HopTraversalResult<unknown>
      })

      const api = createFakeApi(originOk)
      await dryRunInternal(createOptions(api))

      expect(hasDryRunSupport).toHaveBeenCalledWith('Quartz')
    })

    it('handles processHop currency logic: isDestination case', async () => {
      vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
      vi.mocked(findAssetOnDestOrThrow).mockReturnValue({ symbol: 'MAPPED_ACA' } as TAssetInfo)
      vi.mocked(getNativeAssetSymbol).mockReturnValue('ACA')
      vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')
      vi.mocked(hasDryRunSupport).mockReturnValue(true)
      vi.mocked(addEthereumBridgeFees).mockResolvedValue(undefined)

      const originOk = {
        success: true,
        fee: 1_000n,
        forwardedXcms: [null, [{ value: [1] }]],
        destParaId: 1000
      }

      let capturedProcessHop: (params: HopProcessParams<unknown, unknown>) => Promise<unknown>
      vi.mocked(traverseXcmHops).mockImplementation(async params => {
        capturedProcessHop = params.processHop

        const mockHopApi = {
          getDryRunXcm: vi.fn().mockResolvedValue({
            success: true,
            fee: 2_000n
          })
        } as unknown as IPolkadotApi<unknown, unknown>

        const hopResult = await capturedProcessHop({
          api: mockHopApi,
          currentChain: 'Moonbeam',
          currentOrigin: 'Acala',
          currentAsset: { symbol: 'ACA' } as TAssetInfo,
          forwardedXcms: [null, [{ value: [1] }]],
          hasPassedExchange: false,
          isDestination: true
        } as HopProcessParams<unknown, unknown>)

        return {
          hops: [],
          destination: hopResult
        }
      })

      const api = createFakeApi(originOk)
      await dryRunInternal(createOptions(api))

      expect(findAssetInfoOnDest).toHaveBeenCalledWith('Acala', 'Moonbeam', {
        symbol: 'ACA',
        amount: 1_000n
      })
    })

    it('handles processHop currency logic: hasPassedExchange with swapConfig', async () => {
      vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
      vi.mocked(findAssetOnDestOrThrow).mockReturnValue({ symbol: 'USDT' } as TAssetInfo)
      vi.mocked(getNativeAssetSymbol).mockReturnValue('ACA')
      vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')
      vi.mocked(hasDryRunSupport).mockReturnValue(true)
      vi.mocked(addEthereumBridgeFees).mockResolvedValue(undefined)

      const originOk = {
        success: true,
        fee: 1_000n,
        forwardedXcms: [null, [{ value: [1] }]],
        destParaId: 1000
      }

      let capturedProcessHop: (params: HopProcessParams<unknown, unknown>) => Promise<unknown>
      vi.mocked(traverseXcmHops).mockImplementation(async params => {
        capturedProcessHop = params.processHop

        const mockHopApi = {
          getDryRunXcm: vi.fn().mockResolvedValue({
            success: true,
            fee: 2_000n
          })
        } as unknown as IPolkadotApi<unknown, unknown>

        const hopResult = await capturedProcessHop({
          api: mockHopApi,
          currentChain: 'Moonbeam',
          currentOrigin: 'Hydration',
          currentAsset: { symbol: 'ACA' } as TAssetInfo,
          forwardedXcms: [null, [{ value: [1] }]],
          hasPassedExchange: true,
          isDestination: false
        } as HopProcessParams<unknown, unknown>)

        return {
          hops: [],
          destination: hopResult
        }
      })

      const api = createFakeApi(originOk)
      await dryRunInternal(
        createOptions(api, {
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

    it('handles processHop when hop dry run fails', async () => {
      vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
      vi.mocked(getNativeAssetSymbol).mockReturnValue('ACA')
      vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')
      vi.mocked(hasDryRunSupport).mockReturnValue(true)
      vi.mocked(addEthereumBridgeFees).mockResolvedValue(undefined)

      const originOk = {
        success: true,
        fee: 1_000n,
        forwardedXcms: [null, [{ value: [1] }]],
        destParaId: 1000
      }

      let capturedProcessHop: (params: HopProcessParams<unknown, unknown>) => Promise<unknown>
      vi.mocked(traverseXcmHops).mockImplementation(async params => {
        capturedProcessHop = params.processHop

        const mockHopApi = {
          getDryRunXcm: vi.fn().mockResolvedValue({
            success: false,
            failureReason: 'Hop simulation failed'
          })
        } as unknown as IPolkadotApi<unknown, unknown>

        const hopResult = await capturedProcessHop({
          api: mockHopApi,
          currentChain: 'AssetHubPolkadot',
          currentOrigin: 'Acala',
          currentAsset: { symbol: 'ACA' } as TAssetInfo,
          forwardedXcms: [null, [{ value: [1] }]],
          hasPassedExchange: false,
          isDestination: false
        } as HopProcessParams<unknown, unknown>)

        return {
          hops: [
            {
              chain: 'AssetHubPolkadot',
              result: hopResult
            }
          ],
          assetHub: hopResult
        }
      })

      const api = createFakeApi(originOk)
      const res = await dryRunInternal(createOptions(api))

      expect(res.failureReason).toBe('Hop simulation failed')
      expect(res.failureChain).toBe('assetHub')
    })

    it('handles bridge hub fee update when fees differ', async () => {
      vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
      vi.mocked(getNativeAssetSymbol).mockImplementation(chain => {
        if (chain === 'BridgeHubPolkadot') return 'DOT'
        return 'ACA'
      })
      vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')

      const originOk = {
        success: true,
        fee: 1_000n,
        forwardedXcms: [null, [{ value: [1] }]],
        destParaId: 1000
      }

      const originalBridgeHubResult = {
        success: true,
        fee: 2_000n
      }

      vi.mocked(traverseXcmHops).mockResolvedValue({
        hops: [
          {
            chain: 'BridgeHubPolkadot',
            result: originalBridgeHubResult
          }
        ],
        bridgeHub: originalBridgeHubResult
      })

      const updatedBridgeHubResult = {
        success: true,
        fee: 5_000n
      }
      vi.mocked(addEthereumBridgeFees).mockResolvedValue(updatedBridgeHubResult)

      const api = createFakeApi(originOk)
      const res = await dryRunInternal(createOptions(api))

      if (res.hops?.[0].result.success) {
        expect(res.hops?.[0].result.fee).toBe(5_000n)
      }
      if (res.bridgeHub?.success) {
        expect(res.bridgeHub?.fee).toBe(5_000n)
      }
    })

    it('handles bridge hub that is not successful - no fee update', async () => {
      vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
      vi.mocked(getNativeAssetSymbol).mockReturnValue('ACA')
      vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')

      const originOk = {
        success: true,
        fee: 1_000n,
        forwardedXcms: [null, [{ value: [1] }]],
        destParaId: 1000
      }

      const failedBridgeHubResult = {
        success: false,
        failureReason: 'BridgeHub failed'
      }

      vi.mocked(traverseXcmHops).mockResolvedValue({
        hops: [],
        bridgeHub: failedBridgeHubResult
      })

      vi.mocked(addEthereumBridgeFees).mockResolvedValue(undefined)

      const api = createFakeApi(originOk)
      const res = await dryRunInternal(createOptions(api))

      expect(res.bridgeHub).toEqual(failedBridgeHubResult)
    })

    it('handles assetHub failure in getFailureInfo', async () => {
      vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
      vi.mocked(getNativeAssetSymbol).mockReturnValue('ACA')
      vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')
      vi.mocked(addEthereumBridgeFees).mockResolvedValue(undefined)

      const originOk = {
        success: true,
        fee: 1_000n,
        forwardedXcms: [null, [{ value: [1] }]],
        destParaId: 1000
      }

      vi.mocked(traverseXcmHops).mockResolvedValue({
        hops: [],
        assetHub: { success: false, failureReason: 'AssetHub failed' }
      })

      const api = createFakeApi(originOk)
      const res = await dryRunInternal(createOptions(api))

      expect(res.failureReason).toBe('AssetHub failed')
      expect(res.failureChain).toBe('assetHub')
    })

    it('handles hop failure in getFailureInfo', async () => {
      vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
      vi.mocked(getNativeAssetSymbol).mockReturnValue('ACA')
      vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')
      vi.mocked(addEthereumBridgeFees).mockResolvedValue(undefined)

      const originOk = {
        success: true,
        fee: 1_000n,
        forwardedXcms: [null, [{ value: [1] }]],
        destParaId: 1000
      }

      vi.mocked(traverseXcmHops).mockResolvedValue({
        hops: [
          {
            chain: 'Quartz',
            result: { success: false, failureReason: 'Custom hop failed' }
          }
        ]
      })

      const api = createFakeApi(originOk)
      const res = await dryRunInternal(createOptions(api))

      expect(res.failureReason).toBe('Custom hop failed')
      expect(res.failureChain).toBe('Quartz')
    })

    it('handles feeAsset resolution', async () => {
      vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
      vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')
      vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')
      vi.mocked(addEthereumBridgeFees).mockResolvedValue(undefined)

      const originOk = {
        success: true,
        fee: 1_000n,
        forwardedXcms: [null, [{ value: [1] }]],
        destParaId: 1000,
        currency: 'DOT'
      }

      vi.mocked(traverseXcmHops).mockResolvedValue({
        hops: [],
        destination: { success: true, fee: 2_000n }
      })

      const api = createFakeApi(originOk)
      const res = await dryRunInternal(
        createOptions(api, {
          feeAsset: { symbol: 'DOT' }
        })
      )

      if (res.origin.success) expect(res.origin.currency).toBe('DOT')
    })

    it('handles processHop currency logic: Ethereum destination with AssetHub hop', async () => {
      vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
      vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({ symbol: 'ACA' } as TAssetInfo)
      vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')
      vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')
      vi.mocked(hasDryRunSupport).mockReturnValue(true)
      vi.mocked(addEthereumBridgeFees).mockResolvedValue(undefined)

      const originOk = {
        success: true,
        fee: 1_000n,
        forwardedXcms: [null, [{ value: [1] }]],
        destParaId: 1000
      }

      let capturedProcessHop: (params: HopProcessParams<unknown, unknown>) => Promise<unknown>
      vi.mocked(traverseXcmHops).mockImplementation(async params => {
        capturedProcessHop = params.processHop

        const mockHopApi = {
          getDryRunXcm: vi.fn().mockResolvedValue({
            success: true,
            fee: 2_000n
          })
        } as unknown as IPolkadotApi<unknown, unknown>

        const hopResult = await capturedProcessHop({
          api: mockHopApi,
          currentChain: 'AssetHubPolkadot',
          currentOrigin: 'Acala',
          currentAsset: { symbol: 'ACA' } as TAssetInfo,
          forwardedXcms: [null, [{ value: [1] }]],
          hasPassedExchange: false,
          isDestination: false
        } as HopProcessParams<unknown, unknown>)

        return {
          hops: [],
          assetHub: hopResult
        }
      })

      const api = createFakeApi(originOk)
      await dryRunInternal(
        createOptions(api, {
          destination: 'Ethereum'
        })
      )
    })
  })
})

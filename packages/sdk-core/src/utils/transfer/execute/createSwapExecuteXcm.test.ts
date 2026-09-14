import type { TAsset, TAssetInfo, WithAmount } from '@paraspell/assets'
import { getNativeAssetSymbol, isAssetEqual } from '@paraspell/assets'
import { isExternalChain, type TLocation, Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PolkadotApi } from '../../../api'
import { getParaId } from '../../../chains/config'
import { getParaEthTransferFees } from '../../../transfer'
import type { TCreateSwapXcmInternalOptions } from '../../../types'
import { createAsset } from '../../asset'
import { getRelayChainOf } from '../../chain'
import { createEthereumBridgeInstructions } from '../../ethereum/createCustomXcmOnDest'
import { generateMessageId } from '../../ethereum/generateMessageId'
import { localizeLocation } from '../../location'
import { createAssetsFilter } from './createAssetsFilter'
import { createBaseExecuteXcm } from './createBaseExecuteXcm'
import { createExchangeInstructions, createSwapExecuteXcm } from './createSwapExecuteXcm'
import { isMultiHopSwap } from './isMultiHopSwap'
import { prepareCommonExecuteXcm } from './prepareCommonExecuteXcm'

vi.mock('@paraspell/assets')
vi.mock('@paraspell/sdk-common', async importActual => ({
  ...(await importActual()),
  isExternalChain: vi.fn()
}))
vi.mock('../../../chains/config')
vi.mock('../../../transfer', () => ({
  getParaEthTransferFees: vi.fn()
}))
vi.mock('../../location')
vi.mock('../../asset')
vi.mock('../../chain')
vi.mock('../../ethereum/createCustomXcmOnDest')
vi.mock('../../ethereum/generateMessageId')
vi.mock('./createAssetsFilter')
vi.mock('./createBaseExecuteXcm')
vi.mock('./prepareCommonExecuteXcm')
vi.mock('./isMultiHopSwap')

const createTestApi = (): PolkadotApi<object, object, never> => {
  const api: PolkadotApi<object, object, never> = Object.create(PolkadotApi.prototype)
  api.createApiForChain = vi.fn<PolkadotApi<object, object, never>['createApiForChain']>()
  return api
}

type TestOptions = TCreateSwapXcmInternalOptions<object, object, never>

const LOCATION: TLocation = {
  parents: 0,
  interior: 'Here'
}

const ASSET: TAsset = {
  id: LOCATION,
  fun: { Fungible: 1n }
}

const ASSETS_FILTER = {
  Wild: {
    AllOf: {
      id: LOCATION,
      fun: 'Fungible' as const
    }
  }
}

const ASSET_FROM: WithAmount<TAssetInfo> = {
  symbol: 'DOT',
  decimals: 10,
  amount: 2000n,
  location: LOCATION
}

const ASSET_TO: WithAmount<TAssetInfo> = {
  symbol: 'USDT',
  decimals: 6,
  amount: 1500n,
  location: LOCATION
}

const PREPARED_XCM = {
  prefix: [{ SetFeesMode: { jit_withdraw: true } }],
  depositInstruction: {
    DepositAsset: {
      assets: ASSETS_FILTER,
      beneficiary: LOCATION
    }
  }
}

const createOptions = (overrides: Partial<TestOptions> = {}): TestOptions => ({
  api: createTestApi(),
  exchangeChain: 'Hydration',
  assetInfoFrom: ASSET_FROM,
  assetInfoTo: ASSET_TO,
  currencyTo: { symbol: ASSET_TO.symbol },
  sender: 'sender',
  recipient: 'recipient',
  calculateMinAmountOut: vi.fn().mockResolvedValue(100n),
  version: Version.V3,
  fees: {
    originFee: 0n,
    originReserveFee: 10n,
    exchangeFee: 0n,
    destReserveFee: 20n,
    destFee: 0n
  },
  ...overrides
})

describe('createSwapExecuteXcm', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('builds a simple swap XCM when no multi-hop and no destChain', async () => {
    const api = createTestApi()
    vi.spyOn(api, 'findAssetInfoOrThrow').mockReturnValue(ASSET_FROM)
    vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')
    vi.mocked(isMultiHopSwap).mockReturnValue(false)
    vi.mocked(createAsset).mockReturnValue(ASSET)
    vi.mocked(localizeLocation).mockReturnValue(LOCATION)
    vi.mocked(createAssetsFilter).mockReturnValue(ASSETS_FILTER)
    vi.mocked(prepareCommonExecuteXcm).mockReturnValue(PREPARED_XCM)

    const options = createOptions({ api })
    const result = await createSwapExecuteXcm(options)

    expect(prepareCommonExecuteXcm).toHaveBeenCalledOnce()
    expect(isMultiHopSwap).toHaveBeenCalledWith(
      'Hydration',
      options.assetInfoFrom,
      options.assetInfoTo
    )
    expect(result).toEqual({
      [Version.V3]: [
        ...PREPARED_XCM.prefix,
        expect.objectContaining({
          ExchangeAsset: {
            maximal: false,
            give: expect.any(Object),
            want: expect.any(Array)
          }
        }),
        PREPARED_XCM.depositInstruction
      ]
    })
  })

  it('builds a multi-hop swap XCM with destChain and chain provided', async () => {
    const api = createTestApi()
    vi.spyOn(api, 'findAssetInfoOrThrow').mockReturnValue(ASSET_FROM)
    vi.mocked(getNativeAssetSymbol).mockReturnValue('KSM')
    vi.mocked(isMultiHopSwap).mockReturnValue(true)
    vi.mocked(localizeLocation).mockImplementation((_chain, location) => location)
    vi.mocked(createAsset).mockReturnValue(ASSET)
    vi.mocked(prepareCommonExecuteXcm).mockReturnValue(PREPARED_XCM)
    vi.mocked(createBaseExecuteXcm)
      .mockReturnValueOnce([{ ClearOrigin: undefined }])
      .mockReturnValueOnce([{ RefundSurplus: undefined }])
    vi.mocked(getParaId).mockReturnValue(99)

    const minOut = 123n
    const calculateMinAmountOut = vi.fn().mockResolvedValue(minOut)
    const options = createOptions({
      api,
      chain: 'Kusama',
      exchangeChain: 'AssetHubKusama',
      destChain: 'Shiden',
      calculateMinAmountOut,
      version: Version.V4,
      fees: {
        originFee: 0n,
        originReserveFee: 5n,
        exchangeFee: 10n,
        destReserveFee: 15n,
        destFee: 25n
      }
    })

    const result = await createSwapExecuteXcm(options)

    expect(isMultiHopSwap).toHaveBeenCalledWith(
      'AssetHubKusama',
      options.assetInfoFrom,
      options.assetInfoTo
    )
    expect(calculateMinAmountOut).toHaveBeenCalledWith(1985n, ASSET_FROM)
    expect(createBaseExecuteXcm).toHaveBeenCalledTimes(2)
    expect(createBaseExecuteXcm).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        chain: 'AssetHubKusama',
        destChain: 'Shiden',
        feeAssetInfo: undefined,
        fees: { originFee: 0n, reserveFee: 15n, destFee: 25n }
      })
    )
    expect(createBaseExecuteXcm).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        chain: 'Kusama',
        destChain: 'AssetHubKusama',
        feeAssetInfo: undefined,
        fees: { originFee: 0n, reserveFee: 5n, destFee: 10n }
      })
    )
    const commonCall = vi.mocked(prepareCommonExecuteXcm).mock.calls[0][0]
    expect(commonCall.fees).toEqual({ originFee: 0n, reserveFee: 0n, destFee: 0n })
    expect(result).toEqual({
      [Version.V4]: [...PREPARED_XCM.prefix, { RefundSurplus: undefined }]
    })
  })

  describe('Ethereum destination', () => {
    const mockApi = createTestApi()
    const createApiForChain = vi.spyOn(mockApi, 'createApiForChain')
    const findAssetInfoOrThrow = vi.spyOn(mockApi, 'findAssetInfoOrThrow')
    const findNativeAssetInfoOrThrow = vi.spyOn(mockApi, 'findNativeAssetInfoOrThrow')

    const wethFrom: WithAmount<TAssetInfo> = {
      amount: 5000n,
      location: { parents: 1, interior: 'Here' },
      symbol: 'WETH',
      decimals: 18
    }

    const wethTo: WithAmount<TAssetInfo> = {
      amount: 3000n,
      location: LOCATION,
      symbol: 'WETH',
      decimals: 18,
      assetId: '0x123'
    }

    const baseEthOptions = createOptions({
      api: mockApi,
      chain: 'Hydration',
      exchangeChain: 'AssetHubPolkadot',
      destChain: 'Ethereum',
      assetInfoFrom: wethFrom,
      assetInfoTo: wethTo,
      currencyTo: { symbol: 'WETH' },
      sender: 'sender1',
      recipient: 'ethAddr',
      paraIdTo: 1000,
      calculateMinAmountOut: vi.fn().mockResolvedValue(100n),
      fees: {
        originFee: 0n,
        originReserveFee: 10n,
        exchangeFee: 5n,
        destReserveFee: 20n,
        destFee: 0n
      }
    })

    beforeEach(() => {
      vi.mocked(isExternalChain).mockReturnValue(true)
      vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')
      createApiForChain.mockResolvedValue(createTestApi())
      findNativeAssetInfoOrThrow.mockReturnValue({
        symbol: 'DOT',
        decimals: 10,
        location: { parents: 1, interior: 'Here' }
      })
      vi.mocked(getParaEthTransferFees).mockResolvedValue([500n, 200n])
      vi.mocked(isAssetEqual).mockReturnValue(false)
      findAssetInfoOrThrow.mockReturnValue({
        symbol: 'WETH',
        decimals: 18,
        location: LOCATION,
        assetId: '0x123'
      })
      vi.mocked(generateMessageId).mockResolvedValue('msg-id-1')
      vi.mocked(createEthereumBridgeInstructions).mockReturnValue([{ SetTopic: 'snowbridge' }])
      vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')
      vi.mocked(isMultiHopSwap).mockReturnValue(false)
      vi.mocked(createAsset).mockReturnValue(ASSET)
      vi.mocked(createAssetsFilter).mockReturnValue(ASSETS_FILTER)
      vi.mocked(localizeLocation).mockReturnValue(LOCATION)
      vi.mocked(getParaId).mockReturnValue(1000)
      vi.mocked(prepareCommonExecuteXcm).mockReturnValue(PREPARED_XCM)
      vi.mocked(createBaseExecuteXcm).mockReturnValue([{ ClearOrigin: undefined }])
    })

    it('sets up separate fee asset when main asset is not DOT', async () => {
      vi.mocked(isAssetEqual).mockReturnValue(false)

      await createSwapExecuteXcm(baseEthOptions)

      expect(findNativeAssetInfoOrThrow).toHaveBeenCalledWith('Polkadot')

      const commonCall = vi.mocked(prepareCommonExecuteXcm).mock.calls[0][0]
      expect(commonCall.feeAssetInfo).toBeDefined()
      expect(commonCall.useJitWithdraw).toBe(true)
      expect(commonCall.fees).toEqual({ originFee: 700n, reserveFee: 0n, destFee: 0n })

      // bridge fee pool in DOT is offered on every leg
      expect(createBaseExecuteXcm).toHaveBeenCalledWith(
        expect.objectContaining({
          chain: 'Hydration',
          destChain: 'AssetHubPolkadot',
          feeAssetInfo: expect.objectContaining({ symbol: 'DOT' }),
          fees: { originFee: 700n, reserveFee: 700n, destFee: 700n }
        })
      )
    })

    it('does not set separate fee asset when main asset IS DOT', async () => {
      vi.mocked(isAssetEqual).mockReturnValue(true)

      await createSwapExecuteXcm(baseEthOptions)

      const commonCall = vi.mocked(prepareCommonExecuteXcm).mock.calls[0][0]
      expect(commonCall.feeAssetInfo).toBeUndefined()
      expect(commonCall.useJitWithdraw).toBe(true)
      expect(commonCall.fees).toEqual({ originFee: 0n, reserveFee: 0n, destFee: 0n })

      expect(createBaseExecuteXcm).toHaveBeenCalledWith(
        expect.objectContaining({
          chain: 'Hydration',
          destChain: 'AssetHubPolkadot',
          feeAssetInfo: undefined,
          fees: { originFee: 0n, reserveFee: 10n, destFee: 700n }
        })
      )
    })

    it('generates snowbridge instructions for Ethereum dest', async () => {
      await createSwapExecuteXcm(baseEthOptions)

      expect(generateMessageId).toHaveBeenCalled()
      expect(createEthereumBridgeInstructions).toHaveBeenCalled()
    })

    it('uses snowbridge instructions directly when exchange chain is AssetHub', async () => {
      vi.mocked(isAssetEqual).mockReturnValue(false)
      vi.mocked(createBaseExecuteXcm).mockReturnValue([{ ClearOrigin: undefined }])

      const ahOptions: TestOptions = {
        ...baseEthOptions,
        exchangeChain: 'AssetHubPolkadot'
      }

      await createSwapExecuteXcm(ahOptions)

      expect(createBaseExecuteXcm).toHaveBeenCalledTimes(1)
    })
  })

  describe('user fee asset', () => {
    const FEE_ASSET: TAssetInfo = {
      symbol: 'USDC',
      decimals: 6,
      location: { parents: 1, interior: { X1: [{ Parachain: 1000 }] } }
    }

    const fees = {
      originFee: 1n,
      originReserveFee: 2n,
      exchangeFee: 3n,
      destReserveFee: 4n,
      destFee: 5n
    }

    const api = createTestApi()

    beforeEach(() => {
      vi.spyOn(api, 'findAssetInfoOrThrow').mockReturnValue(ASSET_FROM)
      vi.mocked(getNativeAssetSymbol).mockReturnValue('HDX')
      vi.mocked(isMultiHopSwap).mockReturnValue(false)
      vi.mocked(createAsset).mockReturnValue(ASSET)
      vi.mocked(localizeLocation).mockReturnValue(LOCATION)
      vi.mocked(createAssetsFilter).mockReturnValue(ASSETS_FILTER)
      vi.mocked(prepareCommonExecuteXcm).mockReturnValue(PREPARED_XCM)
      vi.mocked(createBaseExecuteXcm).mockReturnValue([{ ClearOrigin: undefined }])
      vi.mocked(getParaId).mockReturnValue(2034)
    })

    it('pays every leg in the fee asset and withdraws the whole fee budget', async () => {
      vi.mocked(isAssetEqual).mockReturnValue(false)

      await createSwapExecuteXcm(
        createOptions({
          api,
          chain: 'AssetHubPolkadot',
          destChain: 'Astar',
          feeAssetInfo: FEE_ASSET,
          fees
        })
      )

      const commonCall = vi.mocked(prepareCommonExecuteXcm).mock.calls[0][0]
      expect(commonCall.feeAssetInfo).toBe(FEE_ASSET)
      expect(commonCall.fees).toEqual({ originFee: 15n, reserveFee: 0n, destFee: 0n })

      expect(createBaseExecuteXcm).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          chain: 'Hydration',
          destChain: 'Astar',
          assetInfo: ASSET_TO,
          feeAssetInfo: FEE_ASSET,
          fees: { originFee: 0n, reserveFee: 4n, destFee: 5n }
        })
      )
      expect(createBaseExecuteXcm).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          chain: 'AssetHubPolkadot',
          destChain: 'Hydration',
          assetInfo: ASSET_FROM,
          feeAssetInfo: FEE_ASSET,
          fees: { originFee: 0n, reserveFee: 2n, destFee: 3n }
        })
      )

      const { suffixXcm } = vi.mocked(createBaseExecuteXcm).mock.calls[1][0]
      expect(suffixXcm?.[0]).toMatchObject({ ExchangeAsset: { maximal: true } })
    })

    it('ignores a fee asset equal to the swapped asset', async () => {
      vi.mocked(isAssetEqual).mockReturnValue(true)

      await createSwapExecuteXcm(
        createOptions({
          api,
          chain: 'AssetHubPolkadot',
          destChain: 'Astar',
          feeAssetInfo: ASSET_FROM,
          fees
        })
      )

      const commonCall = vi.mocked(prepareCommonExecuteXcm).mock.calls[0][0]
      expect(commonCall.feeAssetInfo).toBeUndefined()
      expect(commonCall.fees).toEqual({ originFee: 1n, reserveFee: 0n, destFee: 0n })

      expect(createBaseExecuteXcm).toHaveBeenCalledTimes(2)
      expect(createBaseExecuteXcm).toHaveBeenCalledWith(
        expect.objectContaining({ chain: 'AssetHubPolkadot', feeAssetInfo: undefined })
      )

      const { suffixXcm } = vi.mocked(createBaseExecuteXcm).mock.calls[1][0]
      expect(suffixXcm?.[0]).toMatchObject({ ExchangeAsset: { maximal: false } })
    })
  })

  describe('createExchangeInstructions', () => {
    const api = createTestApi()
    vi.spyOn(api, 'findAssetInfoOrThrow').mockReturnValue(ASSET_FROM)

    const baseOptions = createOptions({
      api,
      exchangeChain: 'Hydration',
      assetInfoFrom: {
        ...ASSET_FROM,
        amount: 1000n
      },
      assetInfoTo: {
        ...ASSET_TO,
        amount: 500n
      },
      calculateMinAmountOut: vi.fn()
    })

    const feeAssetInfo: TAssetInfo = { symbol: 'USDC', decimals: 6, location: LOCATION }

    beforeEach(() => {
      vi.mocked(getNativeAssetSymbol).mockReturnValue('HDX')
      vi.mocked(createAssetsFilter).mockReturnValue(ASSETS_FILTER)
    })

    it('uses maximal: false without a separate fee asset', async () => {
      vi.mocked(isMultiHopSwap).mockReturnValue(false)

      const result = await createExchangeInstructions(baseOptions, ASSET, ASSET, undefined)

      expect(result[0]).toMatchObject({
        ExchangeAsset: { maximal: false }
      })
    })

    it('uses maximal: true with a separate fee asset', async () => {
      vi.mocked(isMultiHopSwap).mockReturnValue(false)

      const result = await createExchangeInstructions(baseOptions, ASSET, ASSET, feeAssetInfo)

      expect(result[0]).toMatchObject({
        ExchangeAsset: { maximal: true }
      })
    })

    it('gives only the swapped native amount in the second hop when the fee asset is the native asset', async () => {
      vi.spyOn(api, 'findAssetInfoOrThrow').mockReturnValue(ASSET_FROM)
      vi.mocked(isMultiHopSwap).mockReturnValue(true)
      vi.mocked(localizeLocation).mockReturnValue(LOCATION)
      vi.mocked(createAsset).mockReturnValue(ASSET)
      const options = createOptions({ api, calculateMinAmountOut: vi.fn().mockResolvedValue(400n) })

      vi.mocked(isAssetEqual).mockReturnValue(true)
      const [firstHop, nativeFeeHop] = await createExchangeInstructions(
        options,
        ASSET,
        ASSET,
        ASSET_FROM
      )

      expect(isAssetEqual).toHaveBeenCalledWith(ASSET_FROM, ASSET_FROM)
      expect(firstHop).toMatchObject({ ExchangeAsset: { maximal: true } })
      expect(nativeFeeHop).toMatchObject({
        ExchangeAsset: { give: { Definite: [ASSET] }, maximal: true }
      })

      vi.mocked(isAssetEqual).mockReturnValue(false)
      const [, otherFeeHop] = await createExchangeInstructions(options, ASSET, ASSET, feeAssetInfo)

      expect(otherFeeHop).toMatchObject({
        ExchangeAsset: { give: ASSETS_FILTER, maximal: true }
      })

      const [plainFirstHop] = await createExchangeInstructions(options, ASSET, ASSET, undefined)

      expect(plainFirstHop).toMatchObject({ ExchangeAsset: { maximal: false } })
    })

    it('does not subtract hop fees from the multi-hop amount when fees are paid separately', async () => {
      vi.spyOn(api, 'findAssetInfoOrThrow').mockReturnValue(ASSET_FROM)
      vi.mocked(isMultiHopSwap).mockReturnValue(true)
      vi.mocked(localizeLocation).mockReturnValue(LOCATION)
      vi.mocked(createAsset).mockReturnValue(ASSET)
      const calculateMinAmountOut = vi.fn().mockResolvedValue(400n)
      const options = createOptions({
        api,
        chain: 'Astar',
        assetInfoFrom: { ...ASSET_FROM, amount: 1000n },
        calculateMinAmountOut,
        fees: {
          originFee: 0n,
          originReserveFee: 5n,
          exchangeFee: 10n,
          destReserveFee: 0n,
          destFee: 0n
        }
      })

      await createExchangeInstructions(options, ASSET, ASSET, feeAssetInfo)
      expect(calculateMinAmountOut).toHaveBeenLastCalledWith(1000n, ASSET_FROM)

      await createExchangeInstructions(options, ASSET, ASSET, undefined)
      expect(calculateMinAmountOut).toHaveBeenLastCalledWith(985n, ASSET_FROM)
    })
  })
})

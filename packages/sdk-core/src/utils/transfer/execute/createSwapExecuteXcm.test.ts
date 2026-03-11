/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import type { TAssetInfo } from '@paraspell/assets'
import {
  findAssetInfoOrThrow,
  findNativeAssetInfoOrThrow,
  getNativeAssetSymbol,
  isAssetEqual
} from '@paraspell/assets'
import { isExternalChain } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getParaId } from '../../../chains/config'
import { getParaEthTransferFees } from '../../../transfer'
import type { TCreateSwapXcmInternalOptions } from '../../../types'
import { createAsset } from '../../asset'
import { getRelayChainOf } from '../../chain'
import { createEthereumBridgeInstructions } from '../../ethereum/createCustomXcmOnDest'
import { generateMessageId } from '../../ethereum/generateMessageId'
import { localizeLocation } from '../../location'
import { addXcmVersionHeader } from '../../xcm-version'
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
vi.mock('../../xcm-version')
vi.mock('../../location')
vi.mock('../../asset')
vi.mock('../../chain')
vi.mock('../../ethereum/createCustomXcmOnDest')
vi.mock('../../ethereum/generateMessageId')
vi.mock('./createAssetsFilter')
vi.mock('./createBaseExecuteXcm')
vi.mock('./prepareCommonExecuteXcm')
vi.mock('./isMultiHopSwap')

describe('createSwapExecuteXcm', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('builds a simple swap XCM when no multi-hop and no destChain', async () => {
    vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')
    vi.mocked(isMultiHopSwap).mockReturnValue(false)
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({
      location: {}
    } as TAssetInfo)
    vi.mocked(createAsset).mockReturnValue({} as any)
    vi.mocked(localizeLocation).mockReturnValue({} as any)
    vi.mocked(createAssetsFilter).mockReturnValue({ Wild: 'All' } as any)
    vi.mocked(prepareCommonExecuteXcm).mockReturnValue({
      prefix: ['P1'] as any,
      depositInstruction: 'D1' as any
    })
    vi.mocked(addXcmVersionHeader).mockImplementation((xcm, _v) => ['HDR', ...(xcm as any[])])

    const options = {
      api: {} as any,
      chain: undefined,
      exchangeChain: 'Hydration' as any,
      destChain: undefined,
      assetInfoFrom: { amount: 2000n, location: {} } as any,
      assetInfoTo: { amount: 1500n, location: {} } as any,
      fees: { originFee: 0n, originReserveFee: 10n, exchangeFee: 0n, destReserveFee: 20n },
      recipientAddress: 'addr1',
      version: 3,
      paraIdTo: 42
    } as unknown as TCreateSwapXcmInternalOptions<unknown, unknown, unknown>

    const result = (await createSwapExecuteXcm(options)) as unknown as any[]

    expect(prepareCommonExecuteXcm).toHaveBeenCalledOnce()
    expect(isMultiHopSwap).toHaveBeenCalledWith(
      'Hydration',
      options.assetInfoFrom,
      options.assetInfoTo
    )
    expect(result[0]).toBe('HDR')
    expect(result[1]).toBe('P1')
    expect(result[2]).toMatchObject({
      ExchangeAsset: {
        maximal: false,
        give: expect.any(Object),
        want: expect.any(Array)
      }
    })
  })

  it('builds a multi-hop swap XCM with destChain and chain provided', async () => {
    vi.mocked(getNativeAssetSymbol).mockReturnValue('KSM')
    vi.mocked(isMultiHopSwap).mockReturnValue(true)
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ location: {} } as any)
    vi.mocked(localizeLocation).mockImplementation((_chain, ml) => ml)
    vi.mocked(createAsset)
      .mockReturnValueOnce({} as any)
      .mockReturnValueOnce({} as any)
      .mockReturnValueOnce({} as any)
    vi.mocked(prepareCommonExecuteXcm).mockReturnValue({
      prefix: ['PFX'] as any,
      depositInstruction: 'DEP' as any
    })
    vi.mocked(createBaseExecuteXcm).mockReturnValueOnce(['X1']).mockReturnValueOnce(['X2'])
    vi.mocked(getParaId).mockReturnValue(99)
    const minOut = 123n
    const calculateMinAmountOut = vi.fn().mockResolvedValue(minOut)
    vi.mocked(addXcmVersionHeader).mockImplementation((xcm, _v) => ['HEAD', ...(xcm as any[])])

    const options = {
      api: {} as any,
      chain: 'Relay',
      exchangeChain: 'Kusama' as any,
      destChain: 'Moonriver' as any,
      assetInfoFrom: { amount: 2000n, location: {} } as any,
      assetInfoTo: { amount: 1500n, location: {} } as any,
      fees: { originFee: 0n, originReserveFee: 5n, exchangeFee: 10n, destReserveFee: 15n },
      recipientAddress: 'addr2',
      version: 2,
      paraIdTo: 77,
      calculateMinAmountOut
    } as unknown as TCreateSwapXcmInternalOptions<unknown, unknown, unknown>

    const result = await createSwapExecuteXcm(options)

    expect(isMultiHopSwap).toHaveBeenCalledWith(
      'Kusama',
      options.assetInfoFrom,
      options.assetInfoTo
    )
    expect(createBaseExecuteXcm).toHaveBeenCalledTimes(2)
    expect(result).toEqual(['HEAD', 'PFX', 'X2'])
  })

  describe('Ethereum destination', () => {
    const mockApi = {
      createApiForChain: vi.fn().mockResolvedValue('ahApi')
    }

    const baseEthOptions = {
      api: mockApi as any,
      chain: 'Hydration' as any,
      exchangeChain: 'AssetHubPolkadot' as any,
      destChain: 'Ethereum' as any,
      assetInfoFrom: {
        amount: 5000n,
        location: { parents: 1, interior: 'Here' },
        symbol: 'WETH'
      } as any,
      assetInfoTo: { amount: 3000n, location: {}, symbol: 'WETH', assetId: '0x123' } as any,
      fees: { originFee: 0n, originReserveFee: 10n, exchangeFee: 5n, destReserveFee: 20n },
      senderAddress: 'sender1',
      recipientAddress: 'ethAddr',
      version: 3,
      paraIdTo: 1000,
      calculateMinAmountOut: vi.fn().mockResolvedValue(100n)
    } as unknown as TCreateSwapXcmInternalOptions<unknown, unknown, unknown>

    beforeEach(() => {
      vi.mocked(isExternalChain).mockReturnValue(true)
      vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')
      vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({
        location: { parents: 1, interior: 'Here' }
      } as any)
      vi.mocked(getParaEthTransferFees).mockResolvedValue([500n, 200n])
      vi.mocked(isAssetEqual).mockReturnValue(false)
      vi.mocked(findAssetInfoOrThrow).mockReturnValue({
        location: {},
        assetId: '0x123'
      } as any)
      vi.mocked(generateMessageId).mockResolvedValue('msg-id-1')
      vi.mocked(createEthereumBridgeInstructions).mockReturnValue(['SNOW1'] as any)
      vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')
      vi.mocked(isMultiHopSwap).mockReturnValue(false)
      vi.mocked(createAsset).mockReturnValue({} as any)
      vi.mocked(createAssetsFilter).mockReturnValue({} as any)
      vi.mocked(localizeLocation).mockReturnValue({} as any)
      vi.mocked(getParaId).mockReturnValue(1000)
      vi.mocked(prepareCommonExecuteXcm).mockReturnValue({
        prefix: ['PFX'] as any,
        depositInstruction: 'DEP' as any
      })
      vi.mocked(createBaseExecuteXcm).mockReturnValue(['BASE1'])
      vi.mocked(addXcmVersionHeader).mockImplementation((xcm, _v) => xcm as any)
    })

    it('sets up separate fee asset when main asset is not DOT', async () => {
      vi.mocked(isAssetEqual).mockReturnValue(false)

      await createSwapExecuteXcm(baseEthOptions)

      expect(findNativeAssetInfoOrThrow).toHaveBeenCalledWith('Polkadot')

      // prepareCommonExecuteXcm should receive feeAssetInfo and useJitWithdraw
      const commonCall = vi.mocked(prepareCommonExecuteXcm).mock.calls[0][0]
      expect(commonCall.feeAssetInfo).toBeDefined()
      expect(commonCall.useJitWithdraw).toBe(true)
      expect(commonCall.fees.originFee).toBe(700n) // 500 + 200
    })

    it('does not set separate fee asset when main asset IS DOT', async () => {
      vi.mocked(isAssetEqual).mockReturnValue(true)

      await createSwapExecuteXcm(baseEthOptions)

      // prepareCommonExecuteXcm should have NO feeAssetInfo, originFee = 0
      const commonCall = vi.mocked(prepareCommonExecuteXcm).mock.calls[0][0]
      expect(commonCall.feeAssetInfo).toBeUndefined()
      expect(commonCall.useJitWithdraw).toBe(true)
      expect(commonCall.fees.originFee).toBe(0n)
    })

    it('generates snowbridge instructions for Ethereum dest', async () => {
      await createSwapExecuteXcm(baseEthOptions)

      expect(generateMessageId).toHaveBeenCalled()
      expect(createEthereumBridgeInstructions).toHaveBeenCalled()
    })

    it('uses snowbridge instructions directly when exchange chain is AssetHub', async () => {
      vi.mocked(isAssetEqual).mockReturnValue(false)
      vi.mocked(createBaseExecuteXcm).mockReturnValue(['BASE1'])

      const ahOptions = {
        ...baseEthOptions,
        exchangeChain: 'AssetHubPolkadot' as any
      } as unknown as TCreateSwapXcmInternalOptions<unknown, unknown, unknown>

      await createSwapExecuteXcm(ahOptions)

      // Only called once for finalXcm (chain → exchangeChain), not for exchangeToDestXcm
      expect(createBaseExecuteXcm).toHaveBeenCalledTimes(1)
    })
  })

  describe('createExchangeInstructions', () => {
    const baseOptions = {
      chain: undefined,
      exchangeChain: 'Hydration' as any,
      assetInfoFrom: { amount: 1000n, location: {} } as any,
      assetInfoTo: { amount: 500n, location: {} } as any,
      version: 3,
      fees: { originFee: 0n, originReserveFee: 0n, exchangeFee: 0n },
      calculateMinAmountOut: vi.fn()
    } as unknown as TCreateSwapXcmInternalOptions<unknown, unknown, unknown>

    beforeEach(() => {
      vi.mocked(getNativeAssetSymbol).mockReturnValue('HDX')
      vi.mocked(findAssetInfoOrThrow).mockReturnValue({ location: {} } as any)
      vi.mocked(createAssetsFilter).mockReturnValue({} as any)
    })

    it('uses maximal: false when hasSeparateFeeAsset is false', async () => {
      vi.mocked(isMultiHopSwap).mockReturnValue(false)

      const result = await createExchangeInstructions(baseOptions, {} as any, {} as any, false)

      expect(result[0]).toMatchObject({
        ExchangeAsset: { maximal: false }
      })
    })

    it('uses maximal: true when hasSeparateFeeAsset is true', async () => {
      vi.mocked(isMultiHopSwap).mockReturnValue(false)

      const result = await createExchangeInstructions(baseOptions, {} as any, {} as any, true)

      expect(result[0]).toMatchObject({
        ExchangeAsset: { maximal: true }
      })
    })
  })
})

import type { TAsset } from '@paraspell/assets'
import {
  getOtherAssets,
  InvalidCurrencyError,
  isForeignAsset,
  type TMultiAsset,
  type TNativeAsset,
  type WithAmount
} from '@paraspell/assets'
import type { TMultiLocation } from '@paraspell/sdk-common'
import { ethers } from 'ethers'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { ScenarioNotSupportedError } from '../../errors'
import PolkadotXCMTransferImpl from '../../pallets/polkadotXcm'
import type { TXcmVersioned } from '../../types'
import { type TPolkadotXCMTransferOptions, Version } from '../../types'
import { getNode } from '../../utils'
import { createExecuteXcm } from '../../utils/createExecuteXcm'
import { generateAddressPayload } from '../../utils/generateAddressPayload'
import { transformMultiLocation } from '../../utils/multiLocation'
import { validateAddress } from '../../utils/validateAddress'
import type AssetHubPolkadot from './AssetHubPolkadot'

vi.mock('ethers', () => ({
  ethers: {
    isAddress: vi.fn()
  }
}))

vi.mock('../polkadotXcm', () => ({
  default: {
    transferPolkadotXCM: vi.fn()
  }
}))

vi.mock('@paraspell/assets', () => ({
  getOtherAssets: vi.fn(),
  getParaId: vi.fn(),
  isAssetEqual: vi.fn(),
  InvalidCurrencyError: class extends Error {},
  isForeignAsset: vi.fn(),
  hasSupportForAsset: vi.fn()
}))

vi.mock('../../utils/generateAddressMultiLocationV4', () => ({
  generateAddressMultiLocationV4: vi.fn()
}))

vi.mock('../../utils/generateAddressPayload', () => ({
  generateAddressPayload: vi.fn()
}))

vi.mock('../../utils/multiLocation', () => ({
  transformMultiLocation: vi.fn()
}))

vi.mock('../../utils/validateAddress', () => ({
  validateAddress: vi.fn()
}))

vi.mock('../../utils/createExecuteXcm', () => ({
  createExecuteXcm: vi.fn()
}))

describe('AssetHubPolkadot', () => {
  let assetHub: AssetHubPolkadot<unknown, unknown>

  const mockApi = {
    callTxMethod: vi.fn().mockResolvedValue('success'),
    createApiForNode: vi.fn().mockResolvedValue({
      getFromStorage: vi.fn().mockResolvedValue('0x0000000000000000')
    }),
    createAccountId: vi.fn().mockReturnValue('0x0000000000000000')
  } as unknown as IPolkadotApi<unknown, unknown>

  const mockInput = {
    api: mockApi,
    asset: { symbol: 'DOT', amount: '1000', isNative: true },
    currencySelection: {} as TXcmVersioned<TMultiAsset[]>,
    scenario: 'ParaToRelay',
    header: {} as TXcmVersioned<TMultiLocation>,
    addressSelection: {} as TXcmVersioned<TMultiLocation>,
    paraIdTo: 1001,
    address: 'address',
    destination: 'Polkadot'
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  beforeEach(() => {
    vi.clearAllMocks()
    assetHub = getNode<unknown, unknown, 'AssetHubPolkadot'>('AssetHubPolkadot')
  })

  describe('handleBridgeTransfer', () => {
    it('should process a valid DOT transfer to Polkadot', () => {
      const mockResult = {} as unknown
      const spy = vi
        .spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')
        .mockReturnValue(mockResult)

      const result = assetHub.handleBridgeTransfer(mockInput, 'Polkadot')
      expect(result).toStrictEqual(mockResult)
      expect(spy).toHaveBeenCalledTimes(1)
    })

    it('should process a valid DOT transfer to Kusama', () => {
      const mockResult = {} as unknown
      const spy = vi
        .spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')
        .mockReturnValue(mockResult)

      const input = { ...mockInput, asset: { symbol: 'DOT' } } as TPolkadotXCMTransferOptions<
        unknown,
        unknown
      >

      const result = assetHub.handleBridgeTransfer(input, 'Kusama')
      expect(result).toStrictEqual(mockResult)
      expect(spy).toHaveBeenCalledTimes(1)
    })

    it('throws InvalidCurrencyError for unsupported currency', () => {
      const input = {
        ...mockInput,
        asset: { symbol: 'UNKNOWN', amount: 100, isNative: true } as WithAmount<TNativeAsset>
      }
      expect(() => assetHub.handleBridgeTransfer(input, 'Polkadot')).toThrow(InvalidCurrencyError)
    })
  })

  describe('handleEthBridgeTransfer', () => {
    it('should throw an error if the address is not a valid Ethereum address', () => {
      vi.mocked(ethers.isAddress).mockReturnValue(false)

      expect(() => assetHub.handleEthBridgeTransfer(mockInput)).toThrowError(
        'Only Ethereum addresses are supported for Ethereum transfers'
      )
    })

    it('should throw InvalidCurrencyError if currency is not supported for Ethereum transfers', () => {
      vi.mocked(ethers.isAddress).mockReturnValue(true)
      vi.mocked(getOtherAssets).mockReturnValue([])

      expect(() => assetHub.handleEthBridgeTransfer(mockInput)).toThrowError(InvalidCurrencyError)
    })

    it('should process a valid ETH transfer', () => {
      vi.mocked(ethers.isAddress).mockReturnValue(true)
      const mockEthAsset = { symbol: 'ETH', assetId: '0x123' }
      vi.mocked(getOtherAssets).mockReturnValue([mockEthAsset])
      vi.mocked(isForeignAsset).mockReturnValue(true)

      const mockResult = {} as unknown
      const spy = vi
        .spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')
        .mockReturnValue(mockResult)

      const input = {
        ...mockInput,
        asset: { symbol: 'ETH', assetId: '0x123', multiLocation: {} },
        destination: 'Ethereum'
      } as TPolkadotXCMTransferOptions<unknown, unknown>
      const result = assetHub.handleEthBridgeTransfer(input)

      expect(result).toStrictEqual(mockResult)
      expect(spy).toHaveBeenCalledTimes(1)
    })
  })

  describe('handleMythosTransfer', () => {
    it('should process a valid Mythos transfer', () => {
      const mockResult = {}
      const spy = vi
        .spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')
        .mockReturnValue(mockResult)

      const input = {
        ...mockInput,
        destination: 'Mythos',
        paraIdTo: 2000
      } as TPolkadotXCMTransferOptions<unknown, unknown>
      const result = assetHub.handleMythosTransfer(input)

      expect(result).toStrictEqual(mockResult)
      expect(spy).toHaveBeenCalledTimes(1)
    })
  })

  describe('transferPolkadotXCM', () => {
    it('throws ScenarioNotSupportedError for native DOT transfers in para to para scenarios', () => {
      const input = {
        ...mockInput,
        asset: { symbol: 'DOT', amount: '1000', isNative: true } as WithAmount<TNativeAsset>,
        scenario: 'ParaToPara',
        destination: 'Acala'
      } as TPolkadotXCMTransferOptions<unknown, unknown>
      vi.mocked(isForeignAsset).mockReturnValue(false)

      expect(() => assetHub.transferPolkadotXCM(input)).toThrow(ScenarioNotSupportedError)
    })

    it('throws ScenarioNotSupportedError for native KSM transfers in para to para scenarios', () => {
      const input = {
        ...mockInput,
        asset: { symbol: 'KSM', amount: '1000', isNative: true } as WithAmount<TNativeAsset>,
        scenario: 'ParaToPara',
        destination: 'Acala'
      } as TPolkadotXCMTransferOptions<unknown, unknown>
      vi.mocked(isForeignAsset).mockReturnValue(false)

      expect(() => assetHub.transferPolkadotXCM(input)).toThrow(ScenarioNotSupportedError)
    })

    it('should process a valid transfer for non-ParaToPara scenario', async () => {
      vi.mocked(getOtherAssets).mockReturnValue([{ symbol: 'DOT', assetId: '' }])

      const mockResult = {}
      const spy = vi
        .spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')
        .mockReturnValue(mockResult)
      const input = {
        ...mockInput,
        scenario: 'RelayToPara'
      } as TPolkadotXCMTransferOptions<unknown, unknown>

      const result = await assetHub.transferPolkadotXCM(input)
      expect(result).toStrictEqual(mockResult)
      expect(spy).toHaveBeenCalledTimes(1)
    })

    it('should call handleBridgeTransfer when destination is AssetHubKusama', async () => {
      mockInput.destination = 'AssetHubKusama'

      const spy = vi.spyOn(assetHub, 'handleBridgeTransfer').mockReturnValue({} as unknown)

      await assetHub.transferPolkadotXCM(mockInput)

      expect(spy).toHaveBeenCalledWith(mockInput, 'Kusama')
    })

    it('should call handleEthBridgeTransfer when destination is Ethereum', async () => {
      mockInput.destination = 'Ethereum'

      vi.mocked(ethers.isAddress).mockReturnValue(true)

      const spy = vi.spyOn(assetHub, 'handleEthBridgeTransfer').mockReturnValue({} as unknown)

      await assetHub.transferPolkadotXCM(mockInput)

      expect(spy).toHaveBeenCalledWith(mockInput)
    })

    it('should call handleMythosTransfer when destination is Mythos', async () => {
      mockInput.destination = 'Mythos'

      const handleMythosTransferSpy = vi
        .spyOn(assetHub, 'handleMythosTransfer')
        .mockReturnValue({} as unknown)

      await assetHub.transferPolkadotXCM(mockInput)

      expect(handleMythosTransferSpy).toHaveBeenCalledWith(mockInput)
    })

    it('should call transferPolkadotXCM when destination is BifrostPolkadot and currency WETH.e', async () => {
      mockInput.destination = 'BifrostPolkadot'
      mockInput.asset = {
        symbol: 'WETH',
        assetId: '0x123',
        amount: '1000',
        multiLocation: {}
      }

      vi.mocked(getOtherAssets).mockReturnValue([
        { symbol: 'WETH', assetId: '0x123', multiLocation: {} }
      ])
      vi.mocked(generateAddressPayload).mockReturnValue({
        [Version.V3]: {}
      } as TXcmVersioned<TMultiLocation>)
      vi.mocked(isForeignAsset).mockReturnValue(true)

      const handleBifrostEthTransferSpy = vi.spyOn(assetHub, 'handleBifrostEthTransfer')

      await assetHub.transferPolkadotXCM(mockInput)

      expect(handleBifrostEthTransferSpy).toHaveBeenCalled()
    })

    it('should modify input for USDT currencySymbol', async () => {
      mockInput.asset = {
        symbol: 'USDT',
        amount: '1000',
        isNative: true
      } as WithAmount<TNativeAsset>
      mockInput.scenario = 'ParaToPara'
      mockInput.destination = 'BifrostPolkadot'

      const mockResult = {}
      const spy = vi
        .spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')
        .mockReturnValue(mockResult)

      await assetHub.transferPolkadotXCM(mockInput)

      expect(spy).toHaveBeenCalled()
    })

    it('should modify input for USDC currencyId', async () => {
      mockInput.asset = {
        symbol: 'USDC',
        assetId: '1',
        amount: '1000'
      }
      mockInput.scenario = 'ParaToPara'
      mockInput.destination = 'BifrostPolkadot'

      const mockResult = {}
      const spy = vi
        .spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')
        .mockReturnValue(mockResult)

      await assetHub.transferPolkadotXCM(mockInput)

      expect(spy).toHaveBeenCalled()
    })

    it('should modify input for DOT transfer to Hydration', async () => {
      mockInput.destination = 'Hydration'
      mockInput.asset = {
        symbol: 'DOT',
        amount: '1000',
        isNative: true
      } as WithAmount<TNativeAsset>

      vi.mocked(getOtherAssets).mockImplementation(node =>
        node === 'Ethereum' ? [] : [{ symbol: 'DOT', assetId: '' }]
      )

      const mockResult = {}
      const spy = vi
        .spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')
        .mockReturnValue(mockResult)

      await assetHub.transferPolkadotXCM(mockInput)

      expect(spy).toHaveBeenCalled()
    })
  })

  it('should call getRelayToParaOverrides with the correct parameters', () => {
    const result = assetHub.getRelayToParaOverrides()

    expect(result).toEqual({
      section: 'limited_teleport_assets',
      includeFee: true
    })
  })

  describe('handleExecuteTransfer', () => {
    beforeEach(() => {
      vi.mocked(validateAddress).mockImplementation(() => {})
    })

    it('should throw error when senderAddress is not provided', async () => {
      const input = { ...mockInput, senderAddress: undefined }
      await expect(assetHub['handleExecuteTransfer'](input)).rejects.toThrow(
        'Please provide senderAddress'
      )
    })

    it('should throw error if dry run fails (success is false)', async () => {
      const input = {
        ...mockInput,
        senderAddress: '0xvalid',
        asset: { ...mockInput.asset, multiLocation: {} }
      }
      mockApi.getDryRun = vi.fn().mockResolvedValue({ success: false, fee: 0n, weight: 0n })
      await expect(assetHub['handleExecuteTransfer'](input)).rejects.toThrow()
    })

    it('should throw error if dry run weight is not found', async () => {
      const input = {
        ...mockInput,
        senderAddress: '0xvalid',
        asset: { ...mockInput.asset, multiLocation: {} }
      }
      mockApi.getDryRun = vi.fn().mockResolvedValue({ success: true, fee: 10000n, weight: null })
      await expect(assetHub['handleExecuteTransfer'](input)).rejects.toThrow(
        'Dry run failed: weight not found'
      )
    })

    it('should throw error if fee conversion fails (quoteAhPrice returns falsy)', async () => {
      const input = {
        ...mockInput,
        senderAddress: '0xvalid',
        asset: { ...mockInput.asset, multiLocation: {} }
      }
      input.asset.amount = '1000000'
      mockApi.getDryRun = vi.fn().mockResolvedValue({ success: true, fee: 10000n, weight: 5000n })
      vi.mocked(transformMultiLocation).mockReturnValue({
        transformed: true
      } as unknown as TMultiLocation)
      mockApi.quoteAhPrice = vi.fn().mockResolvedValue(null)
      await expect(assetHub['handleExecuteTransfer'](input)).rejects.toThrow(
        `Pool DOT -> ${input.asset.symbol} not found.`
      )
    })

    it('should throw error if asset amount is insufficient after fee conversion', async () => {
      const input = {
        ...mockInput,
        senderAddress: '0xvalid',
        asset: { ...mockInput.asset, multiLocation: {} }
      }
      input.asset.amount = '100'
      mockApi.getDryRun = vi.fn().mockResolvedValue({ success: true, fee: 10000n, weight: 5000n })
      vi.mocked(transformMultiLocation).mockReturnValue({
        transformed: true
      } as unknown as TMultiLocation)
      mockApi.quoteAhPrice = vi.fn().mockResolvedValue(150n)
      await expect(assetHub['handleExecuteTransfer'](input)).rejects.toThrow(
        `Insufficient balance. Fee: 150, Amount: ${input.asset.amount}`
      )
    })

    it('should successfully create and return executeXcm transaction', async () => {
      const input = {
        ...mockInput,
        senderAddress: '0xvalid',
        asset: { ...mockInput.asset, multiLocation: {} }
      }
      input.asset.amount = '1000000'
      const dryRunResult = { success: true, fee: 10000n, weight: 5000n }
      mockApi.getDryRun = vi.fn().mockResolvedValue(dryRunResult)
      vi.mocked(transformMultiLocation).mockReturnValue({
        transformed: true
      } as unknown as TMultiLocation)
      mockApi.quoteAhPrice = vi.fn().mockResolvedValue(500n)
      vi.mocked(createExecuteXcm).mockReturnValueOnce('dummyTx').mockReturnValueOnce('finalTx')
      const result = await assetHub['handleExecuteTransfer'](input)
      expect(result).toBe('finalTx')
      expect(createExecuteXcm).toHaveBeenCalledWith(input, dryRunResult.weight, 750n)
    })

    it('should throw error if using overridden multi-assets with xcm execute transfer', () => {
      const input = {
        ...mockInput,
        overriddenAsset: {},
        senderAddress: '0xvalid',
        feeAsset: {} as TAsset
      } as TPolkadotXCMTransferOptions<unknown, unknown>
      expect(() => assetHub['transferPolkadotXCM'](input)).toThrow(
        'Cannot use overridden multi-assets with XCM execute'
      )
    })

    it('should throw error if fee asset does not match', () => {
      const input = {
        ...mockInput,
        senderAddress: '0xvalid',
        feeAsset: { symbol: 'DOT' } as TAsset,
        asset: { symbol: 'KSM', amount: 10000 } as WithAmount<TNativeAsset>
      } as TPolkadotXCMTransferOptions<unknown, unknown>
      expect(() => assetHub['transferPolkadotXCM'](input)).toThrow(
        'Fee asset does not match transfer asset.'
      )
    })
  })
})

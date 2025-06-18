import type { TAsset, TForeignAsset } from '@paraspell/assets'
import {
  findAssetByMultiLocation,
  getNativeAssetSymbol,
  getOtherAssets,
  InvalidCurrencyError,
  isAssetEqual,
  isForeignAsset,
  normalizeSymbol,
  type TMultiAsset,
  type TNativeAsset,
  type WithAmount
} from '@paraspell/assets'
import { hasJunction, type TMultiLocation, Version } from '@paraspell/sdk-common'
import type { MockInstance } from 'vitest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { DOT_MULTILOCATION } from '../../constants'
import { BridgeHaltedError, ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import { getBridgeStatus } from '../../transfer/getBridgeStatus'
import type { TScenario, TTransferLocalOptions } from '../../types'
import { type TPolkadotXCMTransferOptions } from '../../types'
import { getNode } from '../../utils'
import { createBeneficiary } from '../../utils'
import { transformMultiLocation } from '../../utils/multiLocation'
import { createExecuteCall, createExecuteXcm } from '../../utils/transfer'
import { validateAddress } from '../../utils/validateAddress'
import ParachainNode from '../ParachainNode'
import type AssetHubPolkadot from './AssetHubPolkadot'

vi.mock('../../pallets/polkadotXcm', () => ({
  transferPolkadotXcm: vi.fn()
}))

vi.mock('@paraspell/assets', async () => {
  const actual = await vi.importActual('@paraspell/assets')
  return {
    ...actual,
    getOtherAssets: vi.fn(),
    getParaId: vi.fn(),
    InvalidCurrencyError: class extends Error {},
    isForeignAsset: vi.fn(),
    hasSupportForAsset: vi.fn(),
    findAssetByMultiLocation: vi.fn(),
    getNativeAssetSymbol: vi.fn(),
    normalizeSymbol: vi.fn(),
    isAssetEqual: vi.fn()
  }
})

vi.mock('../../transfer/getBridgeStatus', () => ({
  getBridgeStatus: vi.fn()
}))

vi.mock('../../utils/createBeneficiary', () => ({
  createBeneficiary: vi.fn()
}))

vi.mock('../../utils/multiLocation', () => ({
  transformMultiLocation: vi.fn(),
  createBeneficiaryMultiLocation: vi.fn()
}))

vi.mock('../../utils/validateAddress', () => ({
  validateAddress: vi.fn()
}))

vi.mock('../../utils/transfer', () => ({
  createExecuteXcm: vi.fn(),
  createExecuteCall: vi.fn()
}))

vi.mock('../../utils/ethereum/generateMessageId', () => ({
  generateMessageId: vi.fn()
}))

vi.mock('@paraspell/sdk-common', async importOriginal => ({
  ...(await importOriginal<typeof import('@paraspell/sdk-common')>()),
  hasJunction: vi.fn()
}))

describe('AssetHubPolkadot', () => {
  let assetHub: AssetHubPolkadot<unknown, unknown>

  const mockApi = {
    callTxMethod: vi.fn(),
    getXcmWeight: vi.fn(),
    createApiForNode: vi.fn().mockResolvedValue({
      getFromStorage: vi.fn().mockResolvedValue('0x0000000000000000')
    }),
    createAccountId: vi.fn().mockReturnValue('0x0000000000000000'),
    clone: vi.fn()
  } as unknown as IPolkadotApi<unknown, unknown>

  const mockExtrinsic = {} as unknown

  const mockInput = {
    api: mockApi,
    asset: { symbol: 'DOT', amount: '1000', isNative: true },
    multiAsset: {} as TMultiAsset,
    scenario: 'ParaToRelay',
    destLocation: {} as TMultiLocation,
    beneficiaryLocation: {} as TMultiLocation,
    paraIdTo: 1001,
    address: 'address',
    destination: 'Polkadot',
    senderAddress: '0x1234567890abcdef'
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    assetHub = getNode<unknown, unknown, 'AssetHubPolkadot'>('AssetHubPolkadot')
    vi.mocked(getBridgeStatus).mockResolvedValue('Normal')
    vi.mocked(normalizeSymbol).mockImplementation(sym => (sym ?? '').toUpperCase())
    vi.mocked(transferPolkadotXcm).mockResolvedValue(mockExtrinsic)
  })

  it('should initialize with correct values', () => {
    expect(assetHub.node).toBe('AssetHubPolkadot')
    expect(assetHub.info).toBe('PolkadotAssetHub')
    expect(assetHub.type).toBe('polkadot')
    expect(assetHub.version).toBe(Version.V4)
  })

  describe('handleBridgeTransfer', () => {
    it('should process a valid DOT transfer to Polkadot', async () => {
      const result = await assetHub.handleBridgeTransfer(mockInput, 'Polkadot')
      expect(transferPolkadotXcm).toHaveBeenCalledTimes(1)
      expect(result).toBe(mockExtrinsic)
    })

    it('should process a valid DOT transfer to Kusama', async () => {
      const input = { ...mockInput, asset: { symbol: 'DOT' } } as TPolkadotXCMTransferOptions<
        unknown,
        unknown
      >

      const result = await assetHub.handleBridgeTransfer(input, 'Kusama')
      expect(result).toStrictEqual(mockExtrinsic)
      expect(transferPolkadotXcm).toHaveBeenCalledTimes(1)
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
    it('should throw InvalidCurrencyError if currency is not supported for Ethereum transfers', async () => {
      vi.mocked(getOtherAssets).mockReturnValue([])

      await expect(assetHub.handleEthBridgeTransfer(mockInput)).rejects.toThrowError(
        InvalidCurrencyError
      )
    })

    it('should throw BridgeHaltedError if bridge status is not normal', async () => {
      vi.mocked(getOtherAssets).mockReturnValue([{ symbol: 'ETH', assetId: '0x123' }])
      vi.mocked(isForeignAsset).mockReturnValue(true)

      vi.mocked(getBridgeStatus).mockResolvedValue('Halted')

      await expect(assetHub.handleEthBridgeTransfer(mockInput)).rejects.toThrowError(
        BridgeHaltedError
      )
    })

    it('should process a valid ETH transfer', async () => {
      const mockEthAsset = { symbol: 'ETH', assetId: '0x123' }
      vi.mocked(getOtherAssets).mockReturnValue([mockEthAsset])
      vi.mocked(isForeignAsset).mockReturnValue(true)

      const input = {
        ...mockInput,
        asset: { symbol: 'ETH', assetId: '0x123', multiLocation: {} },
        destination: 'Ethereum'
      } as TPolkadotXCMTransferOptions<unknown, unknown>
      const result = await assetHub.handleEthBridgeTransfer(input)

      expect(result).toStrictEqual(mockExtrinsic)
      expect(transferPolkadotXcm).toHaveBeenCalledTimes(1)
    })
  })

  describe('handleEthBridgeNativeTransfer', () => {
    it('should throw an error if the senderAddress is not provided', async () => {
      const input = {
        ...mockInput,
        senderAddress: undefined
      } as TPolkadotXCMTransferOptions<unknown, unknown>

      await expect(assetHub.handleEthBridgeNativeTransfer(input)).rejects.toThrow(
        'Sender address is required for transfers to Ethereum'
      )
    })

    it('should throw if the address is multi-location', async () => {
      const input = {
        ...mockInput,
        address: DOT_MULTILOCATION
      } as TPolkadotXCMTransferOptions<unknown, unknown>

      await expect(assetHub.handleEthBridgeNativeTransfer(input)).rejects.toThrow(
        'Multi-location address is not supported for Ethereum transfers'
      )
    })

    it('should throw InvalidCurrencyError if currency is not supported for Ethereum transfers', async () => {
      vi.mocked(getOtherAssets).mockReturnValue([])

      await expect(assetHub.handleEthBridgeNativeTransfer(mockInput)).rejects.toThrowError(
        InvalidCurrencyError
      )
    })

    it('should throw BridgeHaltedError if bridge status is not normal', async () => {
      vi.mocked(getOtherAssets).mockReturnValue([{ symbol: 'ETH', assetId: '0x123' }])
      vi.mocked(isForeignAsset).mockReturnValue(true)

      vi.mocked(getBridgeStatus).mockResolvedValue('Halted')

      await expect(assetHub.handleEthBridgeNativeTransfer(mockInput)).rejects.toThrowError(
        BridgeHaltedError
      )
    })

    it('should process a valid AH native asset to ETH transfer', async () => {
      const mockEthAsset = { symbol: 'ETH', assetId: '0x123' }
      vi.mocked(getOtherAssets).mockReturnValue([mockEthAsset])
      vi.mocked(isForeignAsset).mockReturnValue(true)

      const spy = vi.spyOn(mockApi, 'callTxMethod').mockResolvedValue('success')

      const input = {
        ...mockInput,
        asset: { symbol: 'ETH', assetId: '0x123', multiLocation: {} },
        destination: 'Ethereum'
      } as TPolkadotXCMTransferOptions<unknown, unknown>

      const result = await assetHub.handleEthBridgeNativeTransfer(input)

      expect(result).toEqual('success')
      expect(spy).toHaveBeenCalledTimes(1)
    })
  })

  describe('handleMythosTransfer', () => {
    it('should process a valid Mythos transfer', async () => {
      const input = {
        ...mockInput,
        destination: 'Mythos',
        paraIdTo: 2000
      } as TPolkadotXCMTransferOptions<unknown, unknown>
      const result = await assetHub.handleMythosTransfer(input)

      expect(result).toStrictEqual(mockExtrinsic)
      expect(transferPolkadotXcm).toHaveBeenCalledTimes(1)
    })
  })

  describe('transferPolkadotXcm', () => {
    it('throws ScenarioNotSupportedError for native DOT transfers in para to para scenarios', async () => {
      const input = {
        ...mockInput,
        asset: { symbol: 'DOT', amount: '1000', isNative: true } as WithAmount<TNativeAsset>,
        scenario: 'ParaToPara',
        destination: 'Acala'
      } as TPolkadotXCMTransferOptions<unknown, unknown>
      vi.mocked(isForeignAsset).mockReturnValue(false)

      await expect(() => assetHub.transferPolkadotXCM(input)).rejects.toThrow(
        ScenarioNotSupportedError
      )
    })

    it('throws ScenarioNotSupportedError for native KSM transfers in para to para scenarios', async () => {
      const input = {
        ...mockInput,
        asset: { symbol: 'KSM', amount: '1000', isNative: true } as WithAmount<TNativeAsset>,
        scenario: 'ParaToPara',
        destination: 'Acala'
      } as TPolkadotXCMTransferOptions<unknown, unknown>
      vi.mocked(isForeignAsset).mockReturnValue(false)

      await expect(() => assetHub.transferPolkadotXCM(input)).rejects.toThrow(
        ScenarioNotSupportedError
      )
    })

    it('should process a valid transfer for non-ParaToPara scenario', async () => {
      vi.mocked(getOtherAssets).mockReturnValue([{ symbol: 'DOT', assetId: '' }])

      const input = {
        ...mockInput,
        scenario: 'RelayToPara'
      } as TPolkadotXCMTransferOptions<unknown, unknown>

      const result = await assetHub.transferPolkadotXCM(input)
      expect(result).toStrictEqual(mockExtrinsic)
      expect(transferPolkadotXcm).toHaveBeenCalledTimes(1)
    })

    it('should call handleBridgeTransfer when destination is AssetHubKusama', async () => {
      mockInput.destination = 'AssetHubKusama'

      const spy = vi.spyOn(assetHub, 'handleBridgeTransfer').mockResolvedValue({} as unknown)

      await assetHub.transferPolkadotXCM(mockInput)

      expect(spy).toHaveBeenCalledWith(mockInput, 'Kusama')
    })

    it('should call handleEthBridgeTransfer when destination is Ethereum', async () => {
      mockInput.destination = 'Ethereum'

      const spy = vi.spyOn(assetHub, 'handleEthBridgeTransfer').mockResolvedValue({} as unknown)

      await assetHub.transferPolkadotXCM(mockInput)

      expect(spy).toHaveBeenCalledWith(mockInput)
    })

    it('should call handleMythosTransfer when destination is Mythos', async () => {
      mockInput.destination = 'Mythos'

      const handleMythosTransferSpy = vi
        .spyOn(assetHub, 'handleMythosTransfer')
        .mockResolvedValue({} as unknown)

      await assetHub.transferPolkadotXCM(mockInput)

      expect(handleMythosTransferSpy).toHaveBeenCalledWith(mockInput)
    })

    it('should call transferPolkadotXCM when destination is BifrostPolkadot and currency WETH.e', async () => {
      mockInput.destination = 'BifrostPolkadot'
      mockInput.asset = {
        symbol: 'WETH',
        assetId: '0x123',
        amount: '1000',
        multiLocation: {} as TMultiLocation
      }

      vi.mocked(getOtherAssets).mockReturnValue([
        { symbol: 'WETH', assetId: '0x123', multiLocation: mockInput.asset.multiLocation }
      ])

      vi.mocked(findAssetByMultiLocation).mockReturnValueOnce({
        symbol: 'WETH',
        multiLocation: {} as TMultiLocation
      })

      vi.mocked(createBeneficiary).mockReturnValue({} as TMultiLocation)
      vi.mocked(isForeignAsset).mockReturnValue(true)

      const handleLocalReserveTransferSpy = vi.spyOn(assetHub, 'handleLocalReserveTransfer')

      await assetHub.transferPolkadotXCM(mockInput)

      expect(handleLocalReserveTransferSpy).toHaveBeenCalled()
    })

    it('should call handleLocalReserveTransfer when feeAsset is KSM', async () => {
      const inputWithFeeAssetKSM = {
        ...mockInput,
        asset: {
          symbol: 'KSM'
        },
        feeAsset: {
          symbol: 'KSM'
        },
        destination: 'Moonbeam',
        api: mockApi
      } as TPolkadotXCMTransferOptions<unknown, unknown>

      vi.mocked(isForeignAsset).mockReturnValue(true)

      const handleLocalReserveTransferSpy = vi
        .spyOn(assetHub, 'handleLocalReserveTransfer')
        .mockReturnValue({} as unknown)

      await assetHub.transferPolkadotXCM(inputWithFeeAssetKSM)

      expect(handleLocalReserveTransferSpy).toHaveBeenCalledWith(inputWithFeeAssetKSM)
      expect(handleLocalReserveTransferSpy.mock.calls[0][1]).toBeUndefined()
    })

    it('should call handleLocalReserveTransfer if asset is Ethereum asset ', async () => {
      const ethAsset = {
        symbol: 'USDC',
        amount: '1000',
        decimals: 6,
        multiLocation: {
          parents: 1,
          interior: { X2: [{ Parachain: 1000 }, { GeneralKey: '0x...' }] }
        }
      } as TForeignAsset
      const inputForEthereumAsset = {
        ...mockInput,
        asset: ethAsset,
        destination: 'Acala',
        api: mockApi
      } as TPolkadotXCMTransferOptions<unknown, unknown>

      vi.mocked(getOtherAssets).mockReturnValue([
        { symbol: 'USDC', multiLocation: ethAsset.multiLocation }
      ] as TForeignAsset[])
      vi.mocked(findAssetByMultiLocation).mockReturnValue(ethAsset)
      vi.mocked(isForeignAsset).mockReturnValue(true)

      const handleLocalReserveTransferSpy = vi.spyOn(assetHub, 'handleLocalReserveTransfer')

      await assetHub.transferPolkadotXCM(inputForEthereumAsset)

      expect(handleLocalReserveTransferSpy).toHaveBeenCalledWith(inputForEthereumAsset, true)
    })

    it('should modify input for USDT currencySymbol', async () => {
      mockInput.asset = {
        symbol: 'USDT',
        amount: '1000',
        multiLocation: {
          parents: 1,
          interior: {
            X1: {
              Parachain: 1000
            }
          }
        },
        isNative: true
      } as WithAmount<TNativeAsset>
      mockInput.scenario = 'ParaToPara'
      mockInput.destination = 'BifrostPolkadot'

      await assetHub.transferPolkadotXCM(mockInput)

      expect(transferPolkadotXcm).toHaveBeenCalled()
    })

    it('should modify input for USDC currencyId', async () => {
      mockInput.asset = {
        symbol: 'USDC',
        multiLocation: {
          parents: 1,
          interior: {
            X1: {
              Parachain: 1000
            }
          }
        } as TMultiLocation,
        amount: '1000'
      }
      mockInput.scenario = 'ParaToPara'
      mockInput.destination = 'BifrostPolkadot'

      await assetHub.transferPolkadotXCM(mockInput)

      expect(transferPolkadotXcm).toHaveBeenCalled()
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

      await assetHub.transferPolkadotXCM(mockInput)

      expect(transferPolkadotXcm).toHaveBeenCalled()
    })
  })

  it('should call getRelayToParaOverrides with the correct parameters', () => {
    const result = assetHub.getRelayToParaOverrides()

    expect(result).toEqual({
      method: 'limited_teleport_assets',
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

    it('should throw error when amount is smaller than MIN_FEE', async () => {
      const input = {
        ...mockInput,
        senderAddress: '0xvalid',
        feeAsset: { ...mockInput.asset },
        asset: { ...mockInput.asset, amount: '1', decimals: 6, multiLocation: {} as TMultiLocation }
      }
      vi.mocked(isAssetEqual).mockReturnValue(true)
      await expect(assetHub['handleExecuteTransfer'](input)).rejects.toThrow(
        'Asset amount 1 is too low, please increase the amount or use a different fee asset.'
      )
    })

    it('should throw error when amount is smaller than calculated fee', async () => {
      const input = {
        ...mockInput,
        senderAddress: '0xvalid',
        feeAsset: { ...mockInput.asset },
        asset: {
          ...mockInput.asset,
          amount: '300001',
          decimals: 6,
          multiLocation: {} as TMultiLocation
        }
      }
      vi.mocked(isAssetEqual).mockReturnValue(true)
      mockApi.getDryRunCall = vi.fn().mockResolvedValue({ success: true, fee: 170000n, weight: 0n })

      await expect(assetHub['handleExecuteTransfer'](input)).rejects.toThrow(
        'Asset amount 300001 is too low, please increase the amount or use a different fee asset.'
      )
    })

    it('should throw error if dry run fails (success is false)', async () => {
      const input = {
        ...mockInput,
        senderAddress: '0xvalid',
        asset: { ...mockInput.asset, multiLocation: {} as TMultiLocation }
      }
      mockApi.getDryRunCall = vi.fn().mockResolvedValue({ success: false, fee: 0n, weight: 0n })
      await expect(assetHub['handleExecuteTransfer'](input)).rejects.toThrow()
    })

    it('should successfully create and return executeXcm transaction', async () => {
      const input = {
        ...mockInput,
        senderAddress: '0xvalid',
        version: Version.V4,
        asset: { ...mockInput.asset, multiLocation: {} as TMultiLocation, decimals: 12 }
      }
      input.asset.amount = '1000000'
      const dryRunResult = { success: true, fee: 10000n }
      mockApi.getDryRunCall = vi.fn().mockResolvedValue(dryRunResult)
      mockApi.getXcmWeight = vi.fn().mockResolvedValue(12000n)
      vi.mocked(transformMultiLocation).mockReturnValue({
        transformed: true
      } as unknown as TMultiLocation)
      mockApi.quoteAhPrice = vi.fn().mockResolvedValue(500n)
      vi.mocked(createExecuteXcm)
        .mockReturnValueOnce({ [Version.V4]: {} } as ReturnType<typeof createExecuteXcm>)
        .mockReturnValueOnce({ [Version.V3]: {} } as ReturnType<typeof createExecuteXcm>)
      vi.mocked(createExecuteCall)
        .mockReturnValueOnce('finalTx' as unknown as ReturnType<typeof createExecuteCall>)
        .mockReturnValueOnce('finalTx' as unknown as ReturnType<typeof createExecuteCall>)
      const result = await assetHub['handleExecuteTransfer'](input)
      expect(result).toBe('finalTx')
      expect(createExecuteXcm).toHaveBeenCalledWith(input, 12000n, Version.V4)
    })

    it('should throw error if using overridden multi-assets with xcm execute transfer', async () => {
      const input = {
        ...mockInput,
        overriddenAsset: {},
        senderAddress: '0xvalid',
        feeAsset: {} as TAsset
      } as TPolkadotXCMTransferOptions<unknown, unknown>
      await expect(() => assetHub['transferPolkadotXCM'](input)).rejects.toThrow(
        'Cannot use overridden multi-assets with XCM execute'
      )
    })

    it('should call handleExecuteTransfer and return its promise if asset symbol is not native', async () => {
      const inputForNonNativeAsset = {
        ...mockInput,
        feeAsset: { symbol: 'USDT' } as TAsset,
        asset: {
          symbol: 'USDT',
          amount: '1000000',
          multiLocation: { parents: 0, interior: { X1: { PalletInstance: 50 } } } as TMultiLocation,
          decimals: 6
        },
        destination: 'Acala',
        scenario: 'ParaToPara'
      } as TPolkadotXCMTransferOptions<unknown, unknown>

      vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')
      mockApi.callTxMethod = vi.fn().mockResolvedValue('mockedExecuteTransferTxOutput')

      const handleExecuteTransferSpy = vi
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .spyOn(assetHub as any, 'handleExecuteTransfer')
        .mockResolvedValue({})

      const result = await assetHub.transferPolkadotXCM(inputForNonNativeAsset)

      expect(handleExecuteTransferSpy).toHaveBeenCalledTimes(1)
      expect(handleExecuteTransferSpy).toHaveBeenCalledWith(inputForNonNativeAsset)

      expect(result).toBe('mockedExecuteTransferTxOutput')
    })
  })

  describe('createCurrencySpec', () => {
    const amount = 1000n
    let superCreateCurrencySpecSpy: MockInstance

    beforeEach(() => {
      superCreateCurrencySpecSpy = vi.spyOn(ParachainNode.prototype, 'createCurrencySpec')
      vi.mocked(hasJunction).mockClear()
      vi.mocked(transformMultiLocation).mockClear()
    })

    afterEach(() => {
      superCreateCurrencySpecSpy.mockRestore()
    })

    it('should call super.createCurrencySpec for non-ParaToPara scenarios', () => {
      const scenario: TScenario = 'RelayToPara'
      const mockAsset = {
        symbol: 'DOT',
        amount: '1000',
        isNative: true
      } as WithAmount<TNativeAsset>
      const expectedSuperResult = {
        V3: [{ id: 'Here' as unknown as TMultiLocation, fun: { Fungible: amount } }]
      }
      superCreateCurrencySpecSpy.mockReturnValue(expectedSuperResult)

      const result = assetHub.createCurrencySpec(amount, scenario, assetHub.version, mockAsset)

      expect(superCreateCurrencySpecSpy).toHaveBeenCalledWith(
        amount,
        scenario,
        assetHub.version,
        mockAsset
      )
      expect(hasJunction).not.toHaveBeenCalled()
      expect(transformMultiLocation).not.toHaveBeenCalled()
      expect(result).toEqual(expectedSuperResult)
    })

    it('should use original MultiLocation for ParaToPara when transformation is not needed', () => {
      const scenario: TScenario = 'ParaToPara'
      const mockMultiLocation: TMultiLocation = {
        parents: 1,
        interior: { X1: { Parachain: 2000 } }
      }
      const mockAsset = {
        symbol: 'DOT',
        amount: '1000',
        isNative: true,
        multiLocation: mockMultiLocation
      } as WithAmount<TNativeAsset>
      const expectedResult = { id: mockMultiLocation, fun: { Fungible: amount } }

      vi.mocked(hasJunction).mockReturnValue(false)

      const result = assetHub.createCurrencySpec(amount, scenario, assetHub.version, mockAsset)

      expect(hasJunction).toHaveBeenCalledWith(mockMultiLocation, 'Parachain', 1000)
      expect(transformMultiLocation).not.toHaveBeenCalled()
      expect(superCreateCurrencySpecSpy).not.toHaveBeenCalled()
      expect(result).toEqual(expectedResult)
    })

    it('should use transformed MultiLocation for ParaToPara when transformation is needed', () => {
      const scenario: TScenario = 'ParaToPara'
      const originalMultiLocation: TMultiLocation = {
        parents: 1,
        interior: { X1: { Parachain: 1000 } }
      }
      const mockAsset = {
        symbol: 'DOT',
        amount: '1000',
        isNative: true,
        multiLocation: originalMultiLocation
      } as WithAmount<TNativeAsset>
      const transformedMultiLocation: TMultiLocation = {
        parents: 0,
        interior: { X1: { AccountId32: { id: '0x123...' } } }
      }
      const expectedResult = { id: transformedMultiLocation, fun: { Fungible: amount } }

      vi.mocked(hasJunction).mockReturnValue(true)
      vi.mocked(transformMultiLocation).mockReturnValue(transformedMultiLocation)

      const result = assetHub.createCurrencySpec(amount, scenario, assetHub.version, mockAsset)

      expect(hasJunction).toHaveBeenCalledWith(originalMultiLocation, 'Parachain', 1000)
      expect(transformMultiLocation).toHaveBeenCalledWith(originalMultiLocation)
      expect(superCreateCurrencySpecSpy).not.toHaveBeenCalled()
      expect(result).toEqual(expectedResult)
    })

    it('should throw InvalidCurrencyError for ParaToPara if asset is missing', () => {
      const scenario: TScenario = 'ParaToPara'
      expect(() =>
        assetHub.createCurrencySpec(amount, scenario, assetHub.version, undefined)
      ).toThrow('Asset does not have a multiLocation defined')
    })

    it('should throw InvalidCurrencyError for ParaToPara if asset has no multiLocation', () => {
      const scenario: TScenario = 'ParaToPara'
      const assetWithoutML = { symbol: 'TST' } as TAsset
      expect(() =>
        assetHub.createCurrencySpec(amount, scenario, assetHub.version, assetWithoutML)
      ).toThrow('Asset does not have a multiLocation defined')
    })

    it('should provide default multi-location if asset is overridden', () => {
      const scenario: TScenario = 'ParaToPara'
      const mockAsset = {
        symbol: 'DOT',
        amount: '1000',
        isNative: true,
        multiLocation: {} as TMultiLocation
      } as WithAmount<TNativeAsset>

      const isOverriddenAsset = true

      const expectedResult = {
        id: {
          parents: 0,
          interior: 'Here'
        },
        fun: { Fungible: amount }
      }

      vi.mocked(hasJunction).mockReturnValue(false)
      vi.mocked(superCreateCurrencySpecSpy).mockReturnValue(expectedResult)

      const result = assetHub.createCurrencySpec(
        amount,
        scenario,
        assetHub.version,
        mockAsset,
        isOverriddenAsset
      )

      expect(result).toEqual(expectedResult)
      expect(hasJunction).toHaveBeenCalled()
    })
  })

  describe('transferLocalNonNativeAsset', () => {
    it('should throw error if asset is not a foreign asset', () => {
      const input = {
        ...mockInput,
        asset: { symbol: 'DOT', amount: '1000', isNative: true } as WithAmount<TNativeAsset>,
        scenario: 'RelayToPara',
        destination: 'Acala',
        to: 'AssetHubPolkadot'
      } as TTransferLocalOptions<unknown, unknown>
      vi.mocked(isForeignAsset).mockReturnValueOnce(false)

      expect(() => assetHub.transferLocalNonNativeAsset(input)).toThrow(InvalidCurrencyError)
    })

    it('should call api.callTxMethod with correct parameters if assetId is defined', () => {
      const mockApi = {
        callTxMethod: vi.fn()
      } as unknown as IPolkadotApi<unknown, unknown>

      const mockInput = {
        api: mockApi,
        asset: { symbol: 'USDC', assetId: '123', amount: '1000' },
        address: '0x1234567890abcdef'
      } as unknown as TTransferLocalOptions<unknown, unknown>

      vi.mocked(isForeignAsset).mockReturnValueOnce(true)

      const spy = vi.spyOn(mockApi, 'callTxMethod')

      assetHub.transferLocalNonNativeAsset(mockInput)

      expect(spy).toHaveBeenCalledWith({
        module: 'Assets',
        method: 'transfer',
        parameters: {
          id: 123,
          target: { Id: mockInput.address },
          amount: BigInt(mockInput.asset.amount)
        }
      })
    })

    it('should call api.callTxMethod with correct parameters if assetId is not defined', () => {
      const mockApi = {
        callTxMethod: vi.fn()
      } as unknown as IPolkadotApi<unknown, unknown>

      const mockInput = {
        api: mockApi,
        asset: { symbol: 'USDC', amount: '1000', multiLocation: {} },
        address: '0x1234567890abcdef'
      } as unknown as TTransferLocalOptions<unknown, unknown>

      vi.mocked(isForeignAsset).mockReturnValueOnce(true)

      const spy = vi.spyOn(mockApi, 'callTxMethod')

      assetHub.transferLocalNonNativeAsset(mockInput)

      expect(spy).toHaveBeenCalledWith({
        module: 'ForeignAssets',
        method: 'transfer',
        parameters: {
          id: {},
          target: { Id: mockInput.address },
          amount: BigInt(mockInput.asset.amount)
        }
      })
    })
  })
})

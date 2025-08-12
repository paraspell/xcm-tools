/* eslint-disable @typescript-eslint/unbound-method */
import type { TAssetInfo } from '@paraspell/assets'
import {
  getNativeAssetSymbol,
  getOtherAssets,
  InvalidCurrencyError,
  isForeignAsset,
  normalizeSymbol,
  type TAsset,
  type TNativeAssetInfo,
  type WithAmount
} from '@paraspell/assets'
import type { TPallet } from '@paraspell/pallets'
import { hasJunction, type TLocation, Version } from '@paraspell/sdk-common'
import type { MockInstance } from 'vitest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { DOT_LOCATION } from '../../constants'
import { BridgeHaltedError, ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import { getBridgeStatus } from '../../transfer/getBridgeStatus'
import type { TScenario, TTransferLocalOptions } from '../../types'
import { type TPolkadotXCMTransferOptions } from '../../types'
import { getChain } from '../../utils'
import { localizeLocation } from '../../utils/location'
import { handleExecuteTransfer } from '../../utils/transfer'
import Parachain from '../Parachain'
import type AssetHubPolkadot from './AssetHubPolkadot'

vi.mock('../../pallets/xcmPallet/utils', () => ({
  createDestination: vi.fn(),
  createVersionedDestination: vi.fn(),
  createBridgeDestination: vi.fn()
}))

vi.mock('../../pallets/polkadotXcm', () => ({
  transferPolkadotXcm: vi.fn()
}))

vi.mock('../../transfer', () => ({
  createTypeAndThenCall: vi.fn()
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
    findAssetInfoByLoc: vi.fn(),
    getNativeAssetSymbol: vi.fn(),
    normalizeSymbol: vi.fn(),
    isAssetEqual: vi.fn()
  }
})

vi.mock('../../transfer/getBridgeStatus', () => ({
  getBridgeStatus: vi.fn()
}))

vi.mock('../../utils/location', () => ({
  localizeLocation: vi.fn(),
  createBeneficiaryLocation: vi.fn()
}))

vi.mock('../../utils/ethereum/generateMessageId', () => ({
  generateMessageId: vi.fn()
}))

vi.mock('@paraspell/sdk-common', async importOriginal => ({
  ...(await importOriginal<typeof import('@paraspell/sdk-common')>()),
  hasJunction: vi.fn()
}))

vi.mock('../../utils/transfer', () => ({
  handleExecuteTransfer: vi.fn()
}))

describe('AssetHubPolkadot', () => {
  let assetHub: AssetHubPolkadot<unknown, unknown>

  const mockApi = {
    callTxMethod: vi.fn(),
    getXcmWeight: vi.fn(),
    createApiForChain: vi.fn().mockResolvedValue({
      getFromStorage: vi.fn().mockResolvedValue('0x0000000000000000')
    }),
    createAccountId: vi.fn().mockReturnValue('0x0000000000000000'),
    clone: vi.fn()
  } as unknown as IPolkadotApi<unknown, unknown>

  const mockExtrinsic = {} as unknown

  const mockInput = {
    api: mockApi,
    assetInfo: { symbol: 'DOT', amount: 1000n, isNative: true },
    asset: {} as TAsset,
    scenario: 'ParaToRelay',
    destLocation: {} as TLocation,
    beneficiaryLocation: {} as TLocation,
    paraIdTo: 1001,
    address: 'address',
    destination: 'Polkadot',
    senderAddress: '0x1234567890abcdef'
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    assetHub = getChain<unknown, unknown, 'AssetHubPolkadot'>('AssetHubPolkadot')
    vi.mocked(getBridgeStatus).mockResolvedValue('Normal')
    vi.mocked(normalizeSymbol).mockImplementation(sym => (sym ?? '').toUpperCase())
    vi.mocked(transferPolkadotXcm).mockResolvedValue(mockExtrinsic)
  })

  it('should initialize with correct values', () => {
    expect(assetHub.chain).toBe('AssetHubPolkadot')
    expect(assetHub.info).toBe('PolkadotAssetHub')
    expect(assetHub.ecosystem).toBe('Polkadot')
    expect(assetHub.version).toBe(Version.V5)
  })

  describe('handleBridgeTransfer', () => {
    it('should process a valid DOT transfer to Polkadot', async () => {
      vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')
      const result = await assetHub.handleBridgeTransfer(mockInput, 'Polkadot')
      expect(transferPolkadotXcm).toHaveBeenCalledTimes(1)
      expect(result).toBe(mockExtrinsic)
    })

    it('should process a valid DOT transfer to Kusama', async () => {
      const input = { ...mockInput, assetInfo: { symbol: 'DOT' } } as TPolkadotXCMTransferOptions<
        unknown,
        unknown
      >
      vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')

      const result = await assetHub.handleBridgeTransfer(input, 'Kusama')
      expect(result).toStrictEqual(mockExtrinsic)
      expect(transferPolkadotXcm).toHaveBeenCalledTimes(1)
    })

    it('throws InvalidCurrencyError for unsupported currency', () => {
      const input = {
        ...mockInput,
        assetInfo: {
          symbol: 'UNKNOWN',
          amount: 1000n,
          isNative: true
        } as WithAmount<TNativeAssetInfo>
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
        assetInfo: { symbol: 'ETH', assetId: '0x123', location: {} },
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

    it('should throw if the address is location', async () => {
      const input = {
        ...mockInput,
        address: DOT_LOCATION
      } as TPolkadotXCMTransferOptions<unknown, unknown>

      await expect(assetHub.handleEthBridgeNativeTransfer(input)).rejects.toThrow(
        'Location address is not supported for Ethereum transfers'
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
        assetInfo: { symbol: 'ETH', assetId: '0x123', location: {} },
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
        assetInfo: { symbol: 'DOT', amount: 1000n, isNative: true } as WithAmount<TNativeAssetInfo>,
        scenario: 'ParaToPara',
        destination: 'Acala'
      } as TPolkadotXCMTransferOptions<unknown, unknown>
      vi.mocked(isForeignAsset).mockReturnValue(false)
      vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')

      await expect(() => assetHub.transferPolkadotXCM(input)).rejects.toThrow(
        ScenarioNotSupportedError
      )
    })

    it('throws ScenarioNotSupportedError for native KSM transfers in para to para scenarios', async () => {
      const input = {
        ...mockInput,
        assetInfo: { symbol: 'KSM', amount: 1000n, isNative: true } as WithAmount<TNativeAssetInfo>,
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

    describe('with feeAsset provided', () => {
      beforeEach(() => {
        vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')
        vi.mocked(handleExecuteTransfer).mockResolvedValue({
          module: 'System' as TPallet,
          method: 'remark',
          parameters: { _remark: '0x' }
        })
        vi.mocked(mockApi.callTxMethod).mockResolvedValue(mockExtrinsic)
      })

      it.each([
        { assetSymbol: 'USDT', feeAssetSymbol: 'DOT', description: 'asset is non-native' },
        { assetSymbol: 'DOT', feeAssetSymbol: 'USDT', description: 'feeAsset is non-native' },
        { assetSymbol: 'USDC', feeAssetSymbol: 'USDT', description: 'both are non-native' }
      ])(
        'should call handleExecuteTransfer when $description',
        async ({ assetSymbol, feeAssetSymbol }) => {
          const input = {
            ...mockInput,
            assetInfo: { symbol: assetSymbol, amount: 100n },
            feeAssetInfo: { symbol: feeAssetSymbol }
          } as TPolkadotXCMTransferOptions<unknown, unknown>
          await assetHub.transferPolkadotXCM(input)
          expect(handleExecuteTransfer).toHaveBeenCalledWith('AssetHubPolkadot', input)
          expect(mockApi.callTxMethod).toHaveBeenCalledTimes(1)
        }
      )

      it('should not call handleExecuteTransfer when both asset and feeAsset are native', async () => {
        const input = {
          ...mockInput,
          destination: 'Acala',
          assetInfo: { symbol: 'DOT', amount: 100n },
          feeAssetInfo: { symbol: 'DOT' }
        } as TPolkadotXCMTransferOptions<unknown, unknown>
        await assetHub.transferPolkadotXCM(input)
        expect(handleExecuteTransfer).not.toHaveBeenCalled()
        expect(transferPolkadotXcm).toHaveBeenCalled()
      })
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

    it('should modify input for USDT currencySymbol', async () => {
      mockInput.assetInfo = {
        symbol: 'USDT',
        amount: 1000n,
        location: {
          parents: 1,
          interior: {
            X1: {
              Parachain: 1000
            }
          }
        },
        isNative: true
      } as WithAmount<TNativeAssetInfo>
      mockInput.scenario = 'ParaToPara'
      mockInput.destination = 'BifrostPolkadot'

      await assetHub.transferPolkadotXCM(mockInput)

      expect(transferPolkadotXcm).toHaveBeenCalled()
    })

    it('should modify input for USDC currencyId', async () => {
      mockInput.assetInfo = {
        symbol: 'USDC',
        location: {
          parents: 1,
          interior: {
            X1: {
              Parachain: 1000
            }
          }
        } as TLocation,
        amount: 1000n
      }
      mockInput.scenario = 'ParaToPara'
      mockInput.destination = 'BifrostPolkadot'

      await assetHub.transferPolkadotXCM(mockInput)

      expect(transferPolkadotXcm).toHaveBeenCalled()
    })

    it('should modify input for DOT transfer to Hydration', async () => {
      mockInput.destination = 'Hydration'
      mockInput.assetInfo = {
        symbol: 'DOT',
        amount: 1000n,
        isNative: true
      } as WithAmount<TNativeAssetInfo>

      vi.mocked(getOtherAssets).mockImplementation(chain =>
        chain === 'Ethereum' ? [] : [{ symbol: 'DOT', assetId: '' }]
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

  describe('createCurrencySpec', () => {
    const amount = 1000n
    let superCreateCurrencySpecSpy: MockInstance

    beforeEach(() => {
      superCreateCurrencySpecSpy = vi.spyOn(Parachain.prototype, 'createCurrencySpec')
      vi.mocked(hasJunction).mockClear()
      vi.mocked(localizeLocation).mockClear()
    })

    afterEach(() => {
      superCreateCurrencySpecSpy.mockRestore()
    })

    it('should call super.createCurrencySpec for non-ParaToPara scenarios', () => {
      const scenario: TScenario = 'RelayToPara'
      const mockAsset = {
        symbol: 'DOT',
        amount: 1000n,
        isNative: true
      } as WithAmount<TNativeAssetInfo>
      const expectedSuperResult = {
        V3: [{ id: 'Here' as unknown as TLocation, fun: { Fungible: amount } }]
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
      expect(localizeLocation).not.toHaveBeenCalled()
      expect(result).toEqual(expectedSuperResult)
    })

    it('should use original Location for ParaToPara when transformation is not needed', () => {
      const scenario: TScenario = 'ParaToPara'
      const mockLocation: TLocation = {
        parents: 1,
        interior: { X1: { Parachain: 2000 } }
      }
      const mockAsset = {
        symbol: 'DOT',
        amount: 1000n,
        isNative: true,
        location: mockLocation
      } as WithAmount<TNativeAssetInfo>
      const expectedResult = { id: mockLocation, fun: { Fungible: amount } }

      vi.mocked(hasJunction).mockReturnValue(false)

      const result = assetHub.createCurrencySpec(amount, scenario, assetHub.version, mockAsset)

      expect(hasJunction).toHaveBeenCalledWith(mockLocation, 'Parachain', 1000)
      expect(localizeLocation).not.toHaveBeenCalled()
      expect(superCreateCurrencySpecSpy).not.toHaveBeenCalled()
      expect(result).toEqual(expectedResult)
    })

    it('should use transformed Location for ParaToPara when transformation is needed', () => {
      const scenario: TScenario = 'ParaToPara'
      const originalLocation: TLocation = {
        parents: 1,
        interior: { X1: { Parachain: 1000 } }
      }
      const mockAsset = {
        symbol: 'DOT',
        amount: 1000n,
        isNative: true,
        location: originalLocation
      } as WithAmount<TNativeAssetInfo>
      const transformedLocation: TLocation = {
        parents: 0,
        interior: { X1: { AccountId32: { id: '0x123...' } } }
      }
      const expectedResult = { id: transformedLocation, fun: { Fungible: amount } }

      vi.mocked(hasJunction).mockReturnValue(true)
      vi.mocked(localizeLocation).mockReturnValue(transformedLocation)

      const result = assetHub.createCurrencySpec(amount, scenario, assetHub.version, mockAsset)

      expect(hasJunction).toHaveBeenCalledWith(originalLocation, 'Parachain', 1000)
      expect(localizeLocation).toHaveBeenCalledWith('AssetHubPolkadot', originalLocation)
      expect(superCreateCurrencySpecSpy).not.toHaveBeenCalled()
      expect(result).toEqual(expectedResult)
    })

    it('should throw InvalidCurrencyError for ParaToPara if asset is missing', () => {
      const scenario: TScenario = 'ParaToPara'
      expect(() =>
        assetHub.createCurrencySpec(amount, scenario, assetHub.version, undefined)
      ).toThrow('Asset does not have a location defined')
    })

    it('should throw InvalidCurrencyError for ParaToPara if asset has no location', () => {
      const scenario: TScenario = 'ParaToPara'
      const assetWithoutML = { symbol: 'TST' } as TAssetInfo
      expect(() =>
        assetHub.createCurrencySpec(amount, scenario, assetHub.version, assetWithoutML)
      ).toThrow('Asset does not have a location defined')
    })

    it('should provide default location if asset is overridden', () => {
      const scenario: TScenario = 'ParaToPara'
      const mockAsset = {
        symbol: 'DOT',
        amount: 1000n,
        isNative: true,
        location: {} as TLocation
      } as WithAmount<TNativeAssetInfo>

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
        assetInfo: { symbol: 'DOT', amount: 1000n, isNative: true } as WithAmount<TNativeAssetInfo>,
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
        assetInfo: { symbol: 'USDC', assetId: '123', amount: 1000n },
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
          amount: BigInt(mockInput.assetInfo.amount)
        }
      })
    })

    it('should call api.callTxMethod with correct parameters if assetId is not defined', () => {
      const mockApi = {
        callTxMethod: vi.fn()
      } as unknown as IPolkadotApi<unknown, unknown>

      const mockInput = {
        api: mockApi,
        assetInfo: { symbol: 'USDC', amount: 1000n, location: {} },
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
          amount: BigInt(mockInput.assetInfo.amount)
        }
      })
    })
  })
})

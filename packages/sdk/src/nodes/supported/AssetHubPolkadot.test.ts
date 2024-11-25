import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ethers } from 'ethers'
import { InvalidCurrencyError, ScenarioNotSupportedError } from '../../errors'
import PolkadotXCMTransferImpl from '../polkadotXcm'
import type AssetHubPolkadot from './AssetHubPolkadot'
import type { TMultiLocationHeader } from '../../types'
import { Version, type TPolkadotXCMTransferOptions } from '../../types'
import { getOtherAssets } from '../../pallets/assets'
import { getNode } from '../../utils'
import { generateAddressPayload } from '../../utils/generateAddressPayload'
import type { ApiPromise } from '@polkadot/api'
import type { Extrinsic, TPjsApi } from '../../pjs/types'
import type { IPolkadotApi } from '../../api'

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

vi.mock('../../pallets/assets', () => ({
  getOtherAssets: vi.fn(),
  getParaId: vi.fn()
}))

vi.mock('../../utils/generateAddressMultiLocationV4', () => ({
  generateAddressMultiLocationV4: vi.fn()
}))

vi.mock('../../utils/generateAddressPayload', () => ({
  generateAddressPayload: vi.fn()
}))

describe('AssetHubPolkadot', () => {
  let assetHub: AssetHubPolkadot<ApiPromise, Extrinsic>

  const mockApi = {
    callTxMethod: vi.fn().mockResolvedValue('success'),
    createApiForNode: vi.fn().mockResolvedValue({
      getFromStorage: vi.fn().mockResolvedValue('0x0000000000000000')
    }),
    createAccountId: vi.fn().mockReturnValue('0x0000000000000000')
  } as unknown as IPolkadotApi<TPjsApi, Extrinsic>

  const mockInput = {
    api: mockApi,
    asset: { symbol: 'DOT' },
    currencySelection: {},
    currencyId: '0',
    scenario: 'ParaToRelay',
    header: {},
    addressSelection: {},
    paraIdTo: 1001,
    amount: '1000',
    address: 'address'
  } as TPolkadotXCMTransferOptions<ApiPromise, Extrinsic>

  beforeEach(() => {
    vi.clearAllMocks()
    assetHub = getNode<ApiPromise, Extrinsic, 'AssetHubPolkadot'>('AssetHubPolkadot')
  })

  describe('handleBridgeTransfer', () => {
    it('should process a valid DOT transfer to Polkadot', () => {
      const mockResult = {} as Extrinsic
      const spy = vi
        .spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')
        .mockReturnValue(mockResult)

      const result = assetHub.handleBridgeTransfer(mockInput, 'Polkadot')
      expect(result).toStrictEqual(mockResult)
      expect(spy).toHaveBeenCalledTimes(1)
    })

    it('should process a valid DOT transfer to Kusama', () => {
      const mockResult = {} as Extrinsic
      const spy = vi
        .spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')
        .mockReturnValue(mockResult)

      const input = { ...mockInput, asset: { symbol: 'DOT' } } as TPolkadotXCMTransferOptions<
        ApiPromise,
        Extrinsic
      >

      const result = assetHub.handleBridgeTransfer(input, 'Kusama')
      expect(result).toStrictEqual(mockResult)
      expect(spy).toHaveBeenCalledTimes(1)
    })

    it('throws InvalidCurrencyError for unsupported currency', () => {
      const input = { ...mockInput, asset: { symbol: 'UNKNOWN' } }
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

      const mockResult = {} as Extrinsic
      const spy = vi
        .spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')
        .mockReturnValue(mockResult)

      const input = {
        ...mockInput,
        asset: { symbol: 'ETH' },
        destination: 'Ethereum'
      } as TPolkadotXCMTransferOptions<ApiPromise, Extrinsic>
      const result = assetHub.handleEthBridgeTransfer(input)

      expect(result).toStrictEqual(mockResult)
      expect(spy).toHaveBeenCalledTimes(1)
    })
  })

  describe('handleMythosTransfer', () => {
    it('should process a valid Mythos transfer', () => {
      const mockResult = {} as Extrinsic
      const spy = vi
        .spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')
        .mockReturnValue(mockResult)

      const input = {
        ...mockInput,
        destination: 'Mythos',
        paraIdTo: 2000,
        currencyId: 'MYTH'
      } as TPolkadotXCMTransferOptions<ApiPromise, Extrinsic>
      const result = assetHub.handleMythosTransfer(input)

      expect(result).toStrictEqual(mockResult)
      expect(spy).toHaveBeenCalledTimes(1)
    })
  })

  describe('transferPolkadotXCM', () => {
    it('throws ScenarioNotSupportedError for native DOT transfers in para to para scenarios', () => {
      const input = {
        ...mockInput,
        asset: { symbol: 'DOT' },
        currencyId: undefined,
        scenario: 'ParaToPara',
        destination: 'Acala'
      } as TPolkadotXCMTransferOptions<ApiPromise, Extrinsic>

      expect(() => assetHub.transferPolkadotXCM(input)).toThrow(ScenarioNotSupportedError)
    })

    it('throws ScenarioNotSupportedError for native KSM transfers in para to para scenarios', () => {
      const input = {
        ...mockInput,
        asset: { symbol: 'KSM' },
        currencyId: undefined,
        scenario: 'ParaToPara',
        destination: 'Acala'
      } as TPolkadotXCMTransferOptions<ApiPromise, Extrinsic>

      expect(() => assetHub.transferPolkadotXCM(input)).toThrow(ScenarioNotSupportedError)
    })

    it('should process a valid transfer for non-ParaToPara scenario', async () => {
      vi.mocked(getOtherAssets).mockReturnValue([{ symbol: 'DOT', assetId: '' }])

      const mockResult = {} as Extrinsic
      const spy = vi
        .spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')
        .mockReturnValue(mockResult)
      const input = {
        ...mockInput,
        scenario: 'RelayToPara'
      } as TPolkadotXCMTransferOptions<ApiPromise, Extrinsic>

      const result = await assetHub.transferPolkadotXCM(input)
      expect(result).toStrictEqual(mockResult)
      expect(spy).toHaveBeenCalledTimes(1)
    })

    it('should call handleBridgeTransfer when destination is AssetHubKusama', async () => {
      mockInput.destination = 'AssetHubKusama'

      const spy = vi.spyOn(assetHub, 'handleBridgeTransfer').mockReturnValue({} as Extrinsic)

      await assetHub.transferPolkadotXCM(mockInput)

      expect(spy).toHaveBeenCalledWith(mockInput, 'Kusama')
    })

    it('should call handleEthBridgeTransfer when destination is Ethereum', async () => {
      mockInput.destination = 'Ethereum'

      vi.mocked(ethers.isAddress).mockReturnValue(true)

      const spy = vi.spyOn(assetHub, 'handleEthBridgeTransfer').mockReturnValue({} as Extrinsic)

      await assetHub.transferPolkadotXCM(mockInput)

      expect(spy).toHaveBeenCalledWith(mockInput)
    })

    it('should call handleMythosTransfer when destination is Mythos', async () => {
      mockInput.destination = 'Mythos'

      const handleMythosTransferSpy = vi
        .spyOn(assetHub, 'handleMythosTransfer')
        .mockReturnValue({} as Extrinsic)

      await assetHub.transferPolkadotXCM(mockInput)

      expect(handleMythosTransferSpy).toHaveBeenCalledWith(mockInput)
    })

    it('should call transferPolkadotXCM when destination is BifrostPolkadot and currency WETH.e', async () => {
      mockInput.destination = 'BifrostPolkadot'
      mockInput.asset = {
        symbol: 'WETH',
        assetId: '0x123'
      }

      vi.mocked(getOtherAssets).mockReturnValue([{ symbol: 'WETH', assetId: '0x123' }])
      vi.mocked(generateAddressPayload).mockReturnValue({
        [Version.V3]: {}
      } as unknown as TMultiLocationHeader)

      const handleBifrostEthTransferSpy = vi.spyOn(assetHub, 'handleBifrostEthTransfer')

      await assetHub.transferPolkadotXCM(mockInput)

      expect(handleBifrostEthTransferSpy).toHaveBeenCalled()
    })

    it('should modify input for USDT currencySymbol', async () => {
      mockInput.asset = {
        symbol: 'USDT'
      }
      mockInput.scenario = 'ParaToPara'
      mockInput.destination = 'BifrostPolkadot'

      const mockResult = {} as Extrinsic
      const spy = vi
        .spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')
        .mockReturnValue(mockResult)

      await assetHub.transferPolkadotXCM(mockInput)

      expect(spy).toHaveBeenCalled()
    })

    it('should modify input for USDC currencyId', async () => {
      mockInput.asset = {
        symbol: 'USDC',
        assetId: '1'
      }
      mockInput.scenario = 'ParaToPara'
      mockInput.destination = 'BifrostPolkadot'

      const mockResult = {} as Extrinsic
      const spy = vi
        .spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')
        .mockReturnValue(mockResult)

      await assetHub.transferPolkadotXCM(mockInput)

      expect(spy).toHaveBeenCalled()
    })

    it('should modify input for DOT transfer to Hydration', async () => {
      mockInput.destination = 'Hydration'
      mockInput.asset = {
        symbol: 'DOT'
      }

      vi.mocked(getOtherAssets).mockImplementation(node =>
        node === 'Ethereum' ? [] : [{ symbol: 'DOT', assetId: '' }]
      )

      const mockResult = {} as Extrinsic
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
})

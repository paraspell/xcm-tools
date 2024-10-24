import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ethers } from 'ethers'
import { InvalidCurrencyError, ScenarioNotSupportedError } from '../../errors'
import PolkadotXCMTransferImpl from '../polkadotXcm'
import type AssetHubPolkadot from './AssetHubPolkadot'
import type { Extrinsic, PolkadotXCMTransferInput } from '../../types'
import { getOtherAssets } from '../../pallets/assets'
import { getNode } from '../../utils'
import type PolkadotJsApi from '../../api/PolkadotJsApi'

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
  let assetHub: AssetHubPolkadot
  const mockInput = {
    api: {} as PolkadotJsApi,
    currencySymbol: 'DOT',
    currencySelection: {},
    currencyId: '0',
    scenario: 'ParaToRelay',
    header: {},
    addressSelection: {},
    paraIdTo: 1001,
    amount: '1000',
    address: 'address'
  } as PolkadotXCMTransferInput

  beforeEach(() => {
    vi.resetAllMocks()
    assetHub = getNode('AssetHubPolkadot')
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

      const input = { ...mockInput, currencySymbol: 'DOT' } as PolkadotXCMTransferInput

      const result = assetHub.handleBridgeTransfer(input, 'Kusama')
      expect(result).toStrictEqual(mockResult)
      expect(spy).toHaveBeenCalledTimes(1)
    })

    it('throws InvalidCurrencyError for unsupported currency', () => {
      const input = { ...mockInput, currencySymbol: 'UNKNOWN' }
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
        currencySymbol: 'ETH',
        destination: 'Ethereum'
      } as PolkadotXCMTransferInput
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
      } as PolkadotXCMTransferInput
      const result = assetHub.handleMythosTransfer(input)

      expect(result).toStrictEqual(mockResult)
      expect(spy).toHaveBeenCalledTimes(1)
    })
  })

  describe('transferPolkadotXCM', () => {
    it('throws ScenarioNotSupportedError for native DOT transfers in para to para scenarios', () => {
      const input = {
        ...mockInput,
        currencySymbol: 'DOT',
        currencyId: undefined,
        scenario: 'ParaToPara',
        destination: 'Acala'
      } as PolkadotXCMTransferInput

      expect(() => assetHub.transferPolkadotXCM(input)).toThrow(ScenarioNotSupportedError)
    })

    it('throws ScenarioNotSupportedError for native KSM transfers in para to para scenarios', () => {
      const input = {
        ...mockInput,
        currencySymbol: 'KSM',
        currencyId: undefined,
        scenario: 'ParaToPara',
        destination: 'Acala'
      } as PolkadotXCMTransferInput

      expect(() => assetHub.transferPolkadotXCM(input)).toThrow(ScenarioNotSupportedError)
    })

    it('should process a valid transfer for non-ParaToPara scenario', () => {
      const mockResult = {} as Extrinsic
      const spy = vi
        .spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')
        .mockReturnValue(mockResult)
      const input = {
        ...mockInput,
        scenario: 'RelayToPara'
      } as PolkadotXCMTransferInput

      const result = assetHub.transferPolkadotXCM(input)
      expect(result).toStrictEqual(mockResult)
      expect(spy).toHaveBeenCalledTimes(1)
    })
  })
})

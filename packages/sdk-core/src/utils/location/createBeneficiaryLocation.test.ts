import type { TMultiLocation } from '@paraspell/sdk-common'
import { Parents, Version } from '@paraspell/sdk-common'
import { isAddress } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { resolveScenario } from '../transfer/resolveScenario'
import { createBeneficiaryLocation, createBeneficiaryLocXTokens } from './createBeneficiaryLocation'
import { createX1Payload } from './createX1Payload'

vi.mock('viem', () => ({
  isAddress: vi.fn()
}))

vi.mock('./createX1Payload', () => ({
  createX1Payload: vi.fn()
}))

vi.mock('../transfer/resolveScenario', () => ({
  resolveScenario: vi.fn()
}))

vi.mock('@paraspell/sdk-common', async () => {
  const actual = await vi.importActual('@paraspell/sdk-common')
  return {
    ...actual,
    isTMultiLocation: vi.fn()
  }
})

describe('createBeneficiaryLocation', () => {
  let apiMock: IPolkadotApi<unknown, unknown>

  const mockOrigin = 'Polkadot'
  const mockDest = 'Acala'

  beforeEach(() => {
    apiMock = {
      accountToHex: vi.fn()
    } as unknown as IPolkadotApi<unknown, unknown>
    vi.clearAllMocks()
  })

  describe('createBeneficiaryLocXTokens', () => {
    it('should return a multilocation object for a multilocation recipient address', async () => {
      const { isTMultiLocation } = await import('@paraspell/sdk-common')
      const recipientAddress = { parents: Parents.ONE, interior: {} } as TMultiLocation
      const version = Version.V4
      vi.mocked(isTMultiLocation).mockReturnValue(true)

      const result = createBeneficiaryLocXTokens({
        api: apiMock,
        origin: mockOrigin,
        destination: mockDest,
        address: recipientAddress,
        version
      })

      expect(result).toEqual(recipientAddress)
      expect(isTMultiLocation).toHaveBeenCalledWith(recipientAddress)
    })

    it('should return a correct payload for ParaToRelay scenario', async () => {
      const { isTMultiLocation } = await import('@paraspell/sdk-common')
      const recipientAddress = '5F3sa2TJAWMqDhXG6jhV4N8ko9iFyzPXj7v5jcmn5ySxkPPg'
      const accIDMock = '0x1234567890abcdef'
      vi.mocked(isTMultiLocation).mockReturnValue(false)
      vi.mocked(isAddress).mockReturnValue(false)
      vi.mocked(resolveScenario).mockReturnValue('ParaToRelay')
      const accountIdSpy = vi.spyOn(apiMock, 'accountToHex').mockReturnValue(accIDMock)
      vi.mocked(createX1Payload).mockReturnValue({
        X1: [{ AccountId32: { id: accIDMock } }]
      })

      const result = createBeneficiaryLocXTokens({
        api: apiMock,
        origin: mockOrigin,
        destination: 'Polkadot',
        address: recipientAddress,
        version: Version.V4
      })

      expect(result).toEqual({
        parents: Parents.ONE,
        interior: { X1: [{ AccountId32: { id: accIDMock } }] }
      })

      expect(resolveScenario).toHaveBeenCalledWith('Polkadot', 'Polkadot')
      expect(accountIdSpy).toHaveBeenCalledWith(recipientAddress)
      expect(createX1Payload).toHaveBeenCalledWith(Version.V4, {
        AccountId32: { id: accIDMock }
      })
    })

    it('should return a correct payload for ParaToPara scenario with Ethereum address', async () => {
      const { isTMultiLocation } = await import('@paraspell/sdk-common')
      const ethAddress = '0x1234567890123456789012345678901234567890'
      vi.mocked(isTMultiLocation).mockReturnValue(false)
      vi.mocked(isAddress).mockReturnValue(true)
      vi.mocked(resolveScenario).mockReturnValue('ParaToPara')

      const result = createBeneficiaryLocXTokens({
        api: apiMock,
        origin: mockOrigin,
        destination: mockDest,
        address: ethAddress,
        version: Version.V4,
        paraId: 1000
      })

      expect(result).toEqual({
        parents: Parents.ONE,
        interior: {
          X2: [{ Parachain: 1000 }, { AccountKey20: { key: ethAddress } }]
        }
      })

      expect(resolveScenario).toHaveBeenCalledWith(mockOrigin, mockDest)
      expect(isAddress).toHaveBeenCalledWith(ethAddress)
    })

    it('should return a correct payload for ParaToPara scenario with standard address', async () => {
      const { isTMultiLocation } = await import('@paraspell/sdk-common')
      const recipientAddress = '5F3sa2TJAWMqDhXG6jhV4N8ko9iFyzPXj7v5jcmn5ySxkPPg'
      const accIDMock = '0x1234567890abcdef'
      vi.mocked(isTMultiLocation).mockReturnValue(false)
      vi.mocked(isAddress).mockReturnValue(false)
      vi.mocked(resolveScenario).mockReturnValue('ParaToPara')
      const accountIdSpy = vi.spyOn(apiMock, 'accountToHex').mockReturnValue(accIDMock)

      const result = createBeneficiaryLocXTokens({
        api: apiMock,
        origin: mockOrigin,
        destination: mockDest,
        address: recipientAddress,
        version: Version.V4,
        paraId: 1000
      })

      expect(result).toEqual({
        parents: Parents.ONE,
        interior: {
          X2: [{ Parachain: 1000 }, { AccountId32: { id: accIDMock } }]
        }
      })

      expect(resolveScenario).toHaveBeenCalledWith(mockOrigin, mockDest)
      expect(isAddress).toHaveBeenCalledWith(recipientAddress)
      expect(accountIdSpy).toHaveBeenCalledWith(recipientAddress)
    })

    it('should return a fallback payload for an unknown scenario with standard address', async () => {
      const { isTMultiLocation } = await import('@paraspell/sdk-common')
      const recipientAddress = '5F3sa2TJAWMqDhXG6jhV4N8ko9iFyzPXj7v5jcmn5ySxkPPg'
      const accIDMock = '0x1234567890abcdef'
      vi.mocked(isTMultiLocation).mockReturnValue(false)
      vi.mocked(isAddress).mockReturnValue(false)
      vi.mocked(resolveScenario).mockReturnValue('RelayToPara')
      const accountIdSpy = vi.spyOn(apiMock, 'accountToHex').mockReturnValue(accIDMock)
      vi.mocked(createX1Payload).mockReturnValue({
        X1: [{ AccountId32: { id: accIDMock } }]
      })

      const result = createBeneficiaryLocXTokens({
        api: apiMock,
        origin: mockOrigin,
        destination: mockDest,
        address: recipientAddress,
        version: Version.V4
      })

      expect(result).toEqual({
        parents: Parents.ZERO,
        interior: { X1: [{ AccountId32: { id: accIDMock } }] }
      })

      expect(resolveScenario).toHaveBeenCalledWith(mockOrigin, mockDest)
      expect(accountIdSpy).toHaveBeenCalledWith(recipientAddress)
      expect(createX1Payload).toHaveBeenCalledWith(Version.V4, {
        AccountId32: { id: accIDMock }
      })
    })

    it('should return a fallback payload for an unknown scenario with Ethereum address', async () => {
      const { isTMultiLocation } = await import('@paraspell/sdk-common')
      const ethAddress = '0x1234567890123456789012345678901234567890'
      vi.mocked(isTMultiLocation).mockReturnValue(false)
      vi.mocked(isAddress).mockReturnValue(true)
      vi.mocked(resolveScenario).mockReturnValue('RelayToPara')
      vi.mocked(createX1Payload).mockReturnValue({
        X1: [{ AccountKey20: { key: ethAddress } }]
      })

      const result = createBeneficiaryLocXTokens({
        api: apiMock,
        origin: mockOrigin,
        destination: mockDest,
        address: ethAddress,
        version: Version.V4
      })

      expect(result).toEqual({
        parents: Parents.ZERO,
        interior: { X1: [{ AccountKey20: { key: ethAddress } }] }
      })

      expect(resolveScenario).toHaveBeenCalledWith(mockOrigin, mockDest)
      expect(isAddress).toHaveBeenCalledWith(ethAddress)
      expect(createX1Payload).toHaveBeenCalledWith(Version.V4, {
        AccountKey20: { key: ethAddress }
      })
    })
  })

  describe('createBeneficiaryLocation', () => {
    it('should return a multilocation object for a multilocation recipient address', async () => {
      const { isTMultiLocation } = await import('@paraspell/sdk-common')
      const recipientAddress = { parents: Parents.ONE, interior: {} } as TMultiLocation
      const version = Version.V4
      vi.mocked(isTMultiLocation).mockReturnValue(true)

      const result = createBeneficiaryLocation({
        api: apiMock,
        address: recipientAddress,
        version
      })

      expect(result).toEqual(recipientAddress)
      expect(isTMultiLocation).toHaveBeenCalledWith(recipientAddress)
    })

    it('should return a correct payload with standard address', async () => {
      const { isTMultiLocation } = await import('@paraspell/sdk-common')
      const recipientAddress = '5F3sa2TJAWMqDhXG6jhV4N8ko9iFyzPXj7v5jcmn5ySxkPPg'
      const accIDMock = '0x1234567890abcdef'
      vi.mocked(isTMultiLocation).mockReturnValue(false)
      vi.mocked(isAddress).mockReturnValue(false)
      const accountIdSpy = vi.spyOn(apiMock, 'accountToHex').mockReturnValue(accIDMock)
      vi.mocked(createX1Payload).mockReturnValue({
        X1: [{ AccountId32: { id: accIDMock } }]
      })

      const result = createBeneficiaryLocation({
        api: apiMock,
        address: recipientAddress,
        version: Version.V4
      })

      expect(result).toEqual({
        parents: Parents.ZERO,
        interior: { X1: [{ AccountId32: { id: accIDMock } }] }
      })

      expect(isAddress).toHaveBeenCalledWith(recipientAddress)
      expect(accountIdSpy).toHaveBeenCalledWith(recipientAddress)
      expect(createX1Payload).toHaveBeenCalledWith(Version.V4, {
        AccountId32: { id: accIDMock }
      })
    })

    it('should return a correct payload with Ethereum address', async () => {
      const { isTMultiLocation } = await import('@paraspell/sdk-common')
      const ethAddress = '0x1234567890123456789012345678901234567890'
      vi.mocked(isTMultiLocation).mockReturnValue(false)
      vi.mocked(isAddress).mockReturnValue(true)
      vi.mocked(createX1Payload).mockReturnValue({
        X1: [{ AccountKey20: { key: ethAddress } }]
      })

      const result = createBeneficiaryLocation({
        api: apiMock,
        address: ethAddress,
        version: Version.V4
      })

      expect(result).toEqual({
        parents: Parents.ZERO,
        interior: { X1: [{ AccountKey20: { key: ethAddress } }] }
      })

      expect(isAddress).toHaveBeenCalledWith(ethAddress)
      expect(createX1Payload).toHaveBeenCalledWith(Version.V4, {
        AccountKey20: { key: ethAddress }
      })
    })
  })
})

import type { TPallet } from '@paraspell/pallets'
import { Parents, Version } from '@paraspell/sdk-common'
import { isAddress } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import type { TScenario } from '../../types'
import { createBeneficiaryMultiLocation } from './createBeneficiaryMultiLocation'
import { createX1Payload } from './createX1Payload'

vi.mock('viem', () => ({
  isAddress: vi.fn()
}))

vi.mock('./createX1Payload', () => ({
  createX1Payload: vi.fn()
}))

describe('createBeneficiaryMultiLocation', () => {
  let apiMock: IPolkadotApi<unknown, unknown>

  beforeEach(() => {
    apiMock = {
      accountToHex: vi.fn()
    } as unknown as IPolkadotApi<unknown, unknown>
  })

  it('should return a multilocation object for a multilocation recipient address', () => {
    const recipientAddress = { parents: Parents.ONE, interior: {} }
    const version = Version.V4

    const result = createBeneficiaryMultiLocation({
      api: apiMock,
      scenario: 'ParaToRelay',
      pallet: null,
      recipientAddress,
      version
    })

    expect(result).toEqual(recipientAddress)
  })

  it('should return a correct payload for ParaToRelay scenario with XTokens pallet', () => {
    const recipientAddress = '5F3sa2TJAWMqDhXG6jhV4N8ko9iFyzPXj7v5jcmn5ySxkPPg'
    const accIDMock = '0x1234567890abcdef'
    vi.mocked(isAddress).mockReturnValue(false)
    const accountIdSpy = vi.spyOn(apiMock, 'accountToHex').mockReturnValue(accIDMock)
    vi.mocked(createX1Payload).mockReturnValue({
      X1: [{ AccountId32: { id: accIDMock, network: 'any' } }]
    })

    const result = createBeneficiaryMultiLocation({
      api: apiMock,
      scenario: 'ParaToRelay',
      pallet: 'XTokens',
      recipientAddress,
      version: Version.V4
    })

    expect(result).toEqual({
      parents: Parents.ONE,
      interior: { X1: [{ AccountId32: { id: accIDMock, network: 'any' } }] }
    })

    expect(accountIdSpy).toHaveBeenCalledWith(recipientAddress)
  })

  it('should return a correct payload for ParaToPara scenario with XTokens pallet and Ethereum address', () => {
    const ethAddress = '0x1234567890123456789012345678901234567890'
    vi.mocked(isAddress).mockReturnValue(true)

    const result = createBeneficiaryMultiLocation({
      api: apiMock,
      scenario: 'ParaToPara',
      pallet: 'XTokens',
      recipientAddress: ethAddress,
      version: Version.V4,
      paraId: 1000
    })

    expect(result).toEqual({
      parents: Parents.ONE,
      interior: {
        X2: [{ Parachain: 1000 }, { AccountKey20: { key: ethAddress } }]
      }
    })

    expect(isAddress).toHaveBeenCalledWith(ethAddress)
  })

  it('should return a correct payload for ParaToPara scenario with PolkadotXcm pallet and standard address', () => {
    const recipientAddress = '5F3sa2TJAWMqDhXG6jhV4N8ko9iFyzPXj7v5jcmn5ySxkPPg'
    const accIDMock = '0x1234567890abcdef'
    vi.mocked(isAddress).mockReturnValue(false)
    const acccountIdSpy = vi.spyOn(apiMock, 'accountToHex').mockReturnValue(accIDMock)
    vi.mocked(createX1Payload).mockReturnValue({
      X1: [{ AccountId32: { id: accIDMock, network: null } }]
    })

    const result = createBeneficiaryMultiLocation({
      api: apiMock,
      scenario: 'ParaToPara',
      pallet: 'PolkadotXcm',
      recipientAddress,
      version: Version.V4
    })

    expect(result).toEqual({
      parents: Parents.ZERO,
      interior: { X1: [{ AccountId32: { id: accIDMock, network: null } }] }
    })

    expect(acccountIdSpy).toHaveBeenCalledWith(recipientAddress)
  })

  it('should return a fallback payload for an unknown scenario', () => {
    const recipientAddress = '5F3sa2TJAWMqDhXG6jhV4N8ko9iFyzPXj7v5jcmn5ySxkPPg'
    const accIDMock = '0x1234567890abcdef'
    vi.mocked(isAddress).mockReturnValue(false)
    const acccountIdSpy = vi.spyOn(apiMock, 'accountToHex').mockReturnValue(accIDMock)
    vi.mocked(createX1Payload).mockReturnValue({
      X1: [{ AccountId32: { id: accIDMock, network: null } }]
    })

    const result = createBeneficiaryMultiLocation({
      api: apiMock,
      scenario: 'UnknownScenario' as TScenario,
      pallet: null,
      recipientAddress,
      version: Version.V4
    })

    expect(result).toEqual({
      parents: Parents.ZERO,
      interior: { X1: [{ AccountId32: { id: accIDMock, network: null } }] }
    })

    expect(acccountIdSpy).toHaveBeenCalledWith(recipientAddress)
  })

  it('should return a correct payload for ParaToPara scenario with XTokens pallet and non-Ethereum address', () => {
    const recipientAddress = '5F3sa2TJAWMqDhXG6jhV4N8ko9iFyzPXj7v5jcmn5ySxkPPg'
    const accIDMock = '0x1234567890abcdef'
    vi.mocked(isAddress).mockReturnValue(false)
    const accountIdSpy = vi.spyOn(apiMock, 'accountToHex').mockReturnValue(accIDMock)

    const result = createBeneficiaryMultiLocation({
      api: apiMock,
      scenario: 'ParaToPara',
      pallet: 'XTokens',
      recipientAddress,
      version: Version.V4,
      paraId: 1000
    })

    expect(result).toEqual({
      parents: Parents.ONE,
      interior: {
        X2: [{ Parachain: 1000 }, { AccountId32: { id: accIDMock } }]
      }
    })

    expect(isAddress).toHaveBeenCalledWith(recipientAddress)
    expect(accountIdSpy).toHaveBeenCalledWith(recipientAddress)
  })

  it('should return a correct payload for ParaToPara scenario with PolkadotXcm pallet and non-Ethereum address', () => {
    const recipientAddress = '5F3sa2TJAWMqDhXG6jhV4N8ko9iFyzPXj7v5jcmn5ySxkPPg'
    const accIDMock = '0x1234567890abcdef'
    vi.mocked(isAddress).mockReturnValue(false)
    const accountIdSpy = vi.spyOn(apiMock, 'accountToHex').mockReturnValue(accIDMock)
    vi.mocked(createX1Payload).mockReturnValue({
      X1: [{ AccountId32: { id: accIDMock, network: null } }]
    })

    const result = createBeneficiaryMultiLocation({
      api: apiMock,
      scenario: 'ParaToPara' as TScenario,
      pallet: 'PolkadotXcm' as TPallet,
      recipientAddress,
      version: Version.V4
    })

    expect(result).toEqual({
      parents: Parents.ZERO,
      interior: { X1: [{ AccountId32: { id: accIDMock, network: null } }] }
    })

    expect(isAddress).toHaveBeenCalledWith(recipientAddress)
    expect(accountIdSpy).toHaveBeenCalledWith(recipientAddress)
    expect(createX1Payload).toHaveBeenCalledWith(Version.V4, {
      AccountId32: { id: accIDMock }
    })
  })
})

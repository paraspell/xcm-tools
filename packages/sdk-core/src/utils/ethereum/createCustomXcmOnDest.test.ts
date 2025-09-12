import {
  findAssetInfoByLoc,
  InvalidCurrencyError,
  isChainEvm,
  isForeignAsset
} from '@paraspell/assets'
import type { TChain, TLocation } from '@paraspell/sdk-common'
import { Parents, Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { InvalidParameterError } from '../../errors'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { createCustomXcmOnDest } from './createCustomXcmOnDest'

vi.mock('@paraspell/assets', () => ({
  findAssetInfoByLoc: vi.fn(),
  getOtherAssets: vi.fn(() => ['mockEthereumAsset']),
  isForeignAsset: vi.fn(),
  isChainEvm: vi.fn(),
  InvalidCurrencyError: class extends Error {}
}))

vi.mock('../location', () => ({
  createBeneficiaryLocation: vi.fn(() => 'mockedBeneficiary')
}))

vi.mock('../assertions')

vi.mock('../../pallets/xcmPallet/utils', () => ({
  createDestination: vi.fn(() => ({}))
}))

describe('createCustomXcmOnDest', () => {
  const stringToUint8a = (str: string) => new TextEncoder().encode(str)
  const hexToUint8a = (hex: string) => {
    const normalizedHex = hex.startsWith('0x') ? hex.slice(2) : hex
    const result = new Uint8Array(normalizedHex.length / 2)
    for (let i = 0; i < normalizedHex.length; i += 2) {
      result[i / 2] = parseInt(normalizedHex.substring(i, i + 2), 16)
    }
    return result
  }
  const accountToHex = vi.fn((address: string) => {
    return '0x' + Buffer.from(address).toString('hex')
  })
  const blake2AsHex = vi.fn(() => '0xfakehash')
  const fakeAccountNextId = '10'

  const api = {
    getFromRpc: vi.fn().mockResolvedValue(fakeAccountNextId),
    accountToHex,
    stringToUint8a,
    hexToUint8a,
    blake2AsHex
  } as unknown as IPolkadotApi<unknown, unknown>

  const mockChain: TChain = 'Acala'
  const version = Version.V4
  const messageId = 'test-message-id'

  const mockLocation = { parents: Parents.ZERO, interior: { Here: null } } as TLocation
  const mockHeader = mockLocation
  const mockBeneficiary = mockLocation
  const mockAsset = { id: mockLocation, fun: { Fungible: 1n } }
  const defaultDestination = { parents: Parents.ONE, interior: { Here: null } } as TLocation
  const baseOptions = {
    api,
    address: '0xRecipient',
    scenario: 'ParaToPara',
    senderAddress: '0xSender',
    destLocation: mockHeader,
    beneficiaryLocation: mockBeneficiary,
    asset: mockAsset,
    destination: defaultDestination,
    version
  } as Partial<TPolkadotXCMTransferOptions<unknown, unknown>>

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(isChainEvm).mockReturnValue(false)
  })

  it('should throw an error if the asset is not a foreign asset', () => {
    const options = {
      ...baseOptions,
      assetInfo: {
        symbol: 'DOT',
        location: {},
        amount: 1000000n
      }
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    vi.mocked(isForeignAsset).mockReturnValue(false)

    expect(() => createCustomXcmOnDest(options, mockChain, messageId)).toThrow(InvalidCurrencyError)
  })

  it('should throw an error if chain is EVM and ahAddress is missing', () => {
    const options = {
      ...baseOptions,
      assetInfo: {
        symbol: 'ETH',
        location: mockLocation,
        amount: 1000000n
      }
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    vi.mocked(isForeignAsset).mockReturnValue(true)
    vi.mocked(isChainEvm).mockReturnValue(true)

    expect(() => createCustomXcmOnDest(options, mockChain, messageId)).toThrow(
      InvalidParameterError
    )
  })

  it('should throw an error if Ethereum asset is not found', () => {
    const options = {
      ...baseOptions,
      assetInfo: {
        symbol: 'ETH',
        location: mockLocation,
        amount: 1000000n
      }
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    vi.mocked(isForeignAsset).mockReturnValue(true)
    vi.mocked(findAssetInfoByLoc).mockReturnValue(undefined)

    expect(() => createCustomXcmOnDest(options, mockChain, messageId)).toThrow(InvalidCurrencyError)
  })

  it('should return a valid XCM message structure', () => {
    const mockEthAsset = {
      symbol: 'ETH',
      decimals: 18,
      assetId: '0x123'
    }

    const options = {
      ...baseOptions,
      assetInfo: {
        symbol: 'ETH',
        location: mockLocation,
        amount: 1000000n
      }
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    vi.mocked(isForeignAsset).mockReturnValue(true)
    vi.mocked(findAssetInfoByLoc).mockReturnValue(mockEthAsset)

    const result = createCustomXcmOnDest(options, mockChain, messageId)

    expect(result).toBeDefined()
    const xcmV4 = result[version]
    expect(Array.isArray(xcmV4)).toBe(true)
    expect(xcmV4.length).toBeGreaterThan(0)

    expect(xcmV4).toContainEqual({
      SetAppendix: [
        {
          DepositAsset: {
            assets: { Wild: 'All' },
            beneficiary: 'mockedBeneficiary'
          }
        }
      ]
    })

    expect(xcmV4).toContainEqual({
      InitiateReserveWithdraw: {
        assets: {
          Wild: {
            AllOf: {
              id: mockLocation,
              fun: 'Fungible'
            }
          }
        },
        reserve: {
          parents: Parents.TWO,
          interior: {
            X1: [
              {
                GlobalConsensus: {
                  Ethereum: { chainId: 1n }
                }
              }
            ]
          }
        },
        xcm: [
          {
            BuyExecution: {
              fees: {
                id: mockLocation,
                fun: { Fungible: 1n }
              },
              weight_limit: 'Unlimited'
            }
          },
          {
            DepositAsset: {
              assets: { Wild: { AllCounted: 1 } },
              beneficiary: {
                parents: Parents.ZERO,
                interior: {
                  X1: [{ AccountKey20: { network: null, key: '0xRecipient' } }]
                }
              }
            }
          },
          {
            SetTopic: messageId
          }
        ]
      }
    })

    expect(xcmV4).toContainEqual({
      SetTopic: messageId
    })
  })
})

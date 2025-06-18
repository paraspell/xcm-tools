/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  findAssetByMultiLocation,
  InvalidCurrencyError,
  isForeignAsset,
  isNodeEvm
} from '@paraspell/assets'
import type { TMultiLocation, TNodeWithRelayChains } from '@paraspell/sdk-common'
import { Parents, Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { InvalidParameterError } from '../../errors'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { createCustomXcmOnDest } from './createCustomXcmOnDest'

vi.mock('@paraspell/assets', () => ({
  findAssetByMultiLocation: vi.fn(),
  getOtherAssets: vi.fn(() => ['mockEthereumAsset']),
  isForeignAsset: vi.fn(),
  isNodeEvm: vi.fn(),
  InvalidCurrencyError: class extends Error {}
}))

vi.mock('../multiLocation', () => ({
  createBeneficiaryMultiLocation: vi.fn(() => 'mockedBeneficiary')
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

  const mockNode: TNodeWithRelayChains = 'Acala'
  const version = Version.V4
  const messageId = 'test-message-id'

  const mockMultiLocation = { parents: Parents.ZERO, interior: { Here: null } } as TMultiLocation
  const mockHeader = mockMultiLocation
  const mockBeneficiary = mockMultiLocation
  const mockMultiAsset = { id: mockMultiLocation, fun: { Fungible: 1n } }
  const defaultDestination = { parents: Parents.ONE, interior: { Here: null } } as TMultiLocation
  const baseOptions = {
    api,
    address: '0xRecipient',
    scenario: 'ParaToPara',
    senderAddress: '0xSender',
    destLocation: mockHeader,
    beneficiaryLocation: mockBeneficiary,
    multiAsset: mockMultiAsset,
    destination: defaultDestination,
    version
  } as Partial<TPolkadotXCMTransferOptions<unknown, unknown>>

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(isNodeEvm).mockReturnValue(false)
  })

  it('should throw an error if the asset is not a foreign asset', () => {
    const options = {
      ...baseOptions,
      asset: {
        symbol: 'DOT',
        multiLocation: {} as TMultiLocation,
        amount: '1000000'
      }
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    vi.mocked(isForeignAsset).mockReturnValue(false)

    expect(() => createCustomXcmOnDest(options, mockNode, messageId)).toThrow(InvalidCurrencyError)
  })

  it('should throw an error if senderAddress is missing', () => {
    const options = {
      ...baseOptions,
      senderAddress: undefined,
      asset: {
        symbol: 'ETH',
        multiLocation: mockMultiLocation,
        amount: '1000000'
      }
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    vi.mocked(isForeignAsset).mockReturnValue(true)

    expect(() => createCustomXcmOnDest(options, mockNode, messageId)).toThrow(InvalidParameterError)
  })

  it('should throw an error if node is EVM and ahAddress is missing', () => {
    const options = {
      ...baseOptions,
      asset: {
        symbol: 'ETH',
        multiLocation: mockMultiLocation,
        amount: '1000000'
      }
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    vi.mocked(isForeignAsset).mockReturnValue(true)
    vi.mocked(isNodeEvm).mockReturnValue(true)

    expect(() => createCustomXcmOnDest(options, mockNode, messageId)).toThrow(InvalidParameterError)
  })

  it('should throw an error if Ethereum asset is not found', () => {
    const options = {
      ...baseOptions,
      asset: {
        symbol: 'ETH',
        multiLocation: mockMultiLocation,
        amount: '1000000'
      }
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    vi.mocked(isForeignAsset).mockReturnValue(true)
    vi.mocked(findAssetByMultiLocation).mockReturnValue(undefined)

    expect(() => createCustomXcmOnDest(options, mockNode, messageId)).toThrow(InvalidCurrencyError)
  })

  it('should create DepositReserveAsset for Mythos origin', () => {
    const mockEthAsset = {
      symbol: 'ETH',
      assetId: '0x123'
    }

    const options = {
      ...baseOptions,
      asset: {
        symbol: 'ETH',
        multiLocation: mockMultiLocation,
        amount: '1000000'
      }
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    vi.mocked(isForeignAsset).mockReturnValue(true)
    vi.mocked(findAssetByMultiLocation).mockReturnValue(mockEthAsset)

    const result = createCustomXcmOnDest(options, 'Mythos', messageId, 1000n)

    const xcmV4 = result[version]
    const setAppendix = xcmV4.find((item: any) => item.SetAppendix)

    expect(setAppendix).toBeDefined()
    if (setAppendix && setAppendix.SetAppendix) {
      expect(setAppendix.SetAppendix[0]).toHaveProperty('DepositReserveAsset')
      expect(setAppendix.SetAppendix[0].DepositReserveAsset).toMatchObject({
        assets: { Wild: 'All' },
        dest: expect.any(Object),
        xcm: expect.arrayContaining([
          {
            BuyExecution: {
              fees: {
                id: {
                  parents: Parents.ZERO,
                  interior: 'Here'
                },
                fun: {
                  Fungible: 1000n
                }
              },
              weight_limit: 'Unlimited'
            }
          },
          {
            DepositAsset: {
              assets: { Wild: 'All' },
              beneficiary: 'mockedBeneficiary'
            }
          }
        ])
      })
    }
  })

  it('should return a valid XCM message structure', () => {
    const mockEthAsset = {
      symbol: 'ETH',
      assetId: '0x123'
    }

    const options = {
      ...baseOptions,
      asset: {
        symbol: 'ETH',
        multiLocation: mockMultiLocation,
        amount: '1000000'
      }
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    vi.mocked(isForeignAsset).mockReturnValue(true)
    vi.mocked(findAssetByMultiLocation).mockReturnValue(mockEthAsset)

    const result = createCustomXcmOnDest(options, mockNode, messageId)

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
              id: mockMultiLocation,
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
                id: mockMultiLocation,
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

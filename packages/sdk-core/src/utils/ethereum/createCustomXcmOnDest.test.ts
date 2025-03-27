import { findAssetByMultiLocation, InvalidCurrencyError, isForeignAsset } from '@paraspell/assets'
import type { TMultiLocation } from '@paraspell/sdk-common'
import { Parents } from '@paraspell/sdk-common'
import { describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import type { TPolkadotXCMTransferOptions, Version } from '../../types'
import { createCustomXcmOnDest } from './createCustomXcmOnDest'

// Mock dependencies
vi.mock('@paraspell/assets', () => ({
  findAssetByMultiLocation: vi.fn(),
  getOtherAssets: vi.fn(() => ['mockEthereumAsset']),
  isForeignAsset: vi.fn(),
  InvalidCurrencyError: class extends Error {}
}))

vi.mock('../multiLocation', () => ({
  createBeneficiaryMultiLocation: vi.fn(() => 'mockedBeneficiary')
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
  } as unknown as IPolkadotApi<{ provider: unknown }, unknown>

  const version = 'V3' as Version
  const messageId = 'test-message-id'

  it('should throw an error if the asset is not a foreign asset', () => {
    const options: TPolkadotXCMTransferOptions<{ provider: unknown }, unknown> = {
      api: api,
      address: '0xRecipient',
      asset: { symbol: 'DOT', multiLocation: {} as TMultiLocation, amount: '1000000' },
      scenario: 'ParaToPara',
      senderAddress: '0xSender',
      header: { V3: { parents: Parents.ZERO, interior: { Here: null } } },
      addressSelection: { V3: { parents: Parents.ZERO, interior: { Here: null } } },
      currencySelection: {
        V3: [{ id: { parents: Parents.ZERO, interior: { Here: null } }, fun: { Fungible: 1n } }]
      }, // minimal valid TXcmVersioned structure
      destination: { parents: Parents.ONE, interior: { Here: null } }
    }

    vi.mocked(isForeignAsset).mockReturnValue(false)

    expect(() => createCustomXcmOnDest(options, version, messageId)).toThrow(InvalidCurrencyError)
  })

  it('should throw an error if asset has no multiLocation', () => {
    const options: TPolkadotXCMTransferOptions<{ provider: unknown }, unknown> = {
      api: api,
      address: '0xRecipient',
      asset: { symbol: 'ETH', multiLocation: {} as TMultiLocation, amount: '1000000' },
      scenario: 'ParaToPara',
      senderAddress: '0xSender',
      header: { V3: { parents: Parents.ZERO, interior: { Here: null } } },
      addressSelection: { V3: { parents: Parents.ZERO, interior: { Here: null } } },
      currencySelection: {
        V3: [{ id: { parents: Parents.ZERO, interior: { Here: null } }, fun: { Fungible: 1n } }]
      }, // minimal valid TXcmVersioned structure
      destination: { parents: Parents.ONE, interior: { Here: null } }
    }

    vi.mocked(isForeignAsset).mockReturnValue(true)

    expect(() => createCustomXcmOnDest(options, version, messageId)).toThrow(InvalidCurrencyError)
  })

  it('should throw an error if senderAddress is missing', () => {
    const options: TPolkadotXCMTransferOptions<{ provider: unknown }, unknown> = {
      api: api,
      address: '0xRecipient',
      asset: {
        symbol: 'ETH',
        multiLocation: { parents: Parents.ZERO, interior: { Here: null } },
        amount: '1000000'
      },
      scenario: 'ParaToPara',
      senderAddress: '',
      header: { V3: { parents: Parents.ZERO, interior: { Here: null } } },
      addressSelection: { V3: { parents: Parents.ZERO, interior: { Here: null } } },
      currencySelection: {
        V3: [{ id: { parents: Parents.ZERO, interior: { Here: null } }, fun: { Fungible: 1n } }]
      }, // minimal valid TXcmVersioned structure
      destination: { parents: Parents.ONE, interior: { Here: null } }
    }

    vi.mocked(isForeignAsset).mockReturnValue(true)

    expect(() => createCustomXcmOnDest(options, version, messageId)).toThrow(InvalidCurrencyError)
  })

  it('should throw an error if Ethereum asset is not found', () => {
    const options: TPolkadotXCMTransferOptions<{ provider: unknown }, unknown> = {
      api: api,
      address: '0xRecipient',
      asset: {
        symbol: 'ETH',
        multiLocation: { parents: Parents.ZERO, interior: { Here: null } },
        amount: '1000000'
      },
      scenario: 'ParaToPara',
      senderAddress: '0xSender',
      header: { V3: { parents: Parents.ZERO, interior: { Here: null } } },
      addressSelection: { V3: { parents: Parents.ZERO, interior: { Here: null } } },
      currencySelection: {
        V3: [{ id: { parents: Parents.ZERO, interior: { Here: null } }, fun: { Fungible: 1n } }]
      }, // minimal valid TXcmVersioned structure
      destination: { parents: Parents.ONE, interior: { Here: null } }
    }

    vi.mocked(isForeignAsset).mockReturnValue(true)
    vi.mocked(findAssetByMultiLocation).mockReturnValue(undefined)

    expect(() => createCustomXcmOnDest(options, version, messageId)).toThrow(InvalidCurrencyError)
  })

  it('should return a valid XCM message structure', () => {
    const mockEthAsset = {
      symbol: 'ETH',
      assetId: '0x123'
    }

    const options: TPolkadotXCMTransferOptions<{ provider: unknown }, unknown> = {
      api: api,
      address: '0xRecipient',
      asset: {
        symbol: 'ETH',
        multiLocation: { parents: Parents.ZERO, interior: { Here: null } },
        amount: '1000000'
      },
      scenario: 'ParaToPara',
      senderAddress: '0xSender',
      header: { V3: { parents: Parents.ZERO, interior: { Here: null } } },
      addressSelection: { V3: { parents: Parents.ZERO, interior: { Here: null } } },
      currencySelection: {
        V3: [{ id: { parents: Parents.ZERO, interior: { Here: null } }, fun: { Fungible: 1n } }]
      }, // minimal valid TXcmVersioned structure
      destination: { parents: Parents.ONE, interior: { Here: null } }
    }

    vi.mocked(isForeignAsset).mockReturnValue(true)
    vi.mocked(findAssetByMultiLocation).mockReturnValue(mockEthAsset)

    const result = createCustomXcmOnDest(options, version, messageId)

    expect(result).toBeDefined()
    expect(result[version]).toBeInstanceOf(Array)
    expect(result[version].length).toBeGreaterThan(0)

    expect(result[version]).toContainEqual({
      SetAppendix: [
        {
          DepositAsset: {
            assets: { Wild: 'All' },
            beneficiary: 'mockedBeneficiary'
          }
        }
      ]
    })

    expect(result[version]).toContainEqual({
      InitiateReserveWithdraw: {
        assets: {
          Wild: {
            AllOf: {
              id: { parents: Parents.ZERO, interior: { Here: null } },
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
                id: {
                  parents: Parents.ZERO,
                  interior: { Here: null }
                },
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

    expect(result[version]).toContainEqual({
      SetTopic: messageId
    })
  })
})

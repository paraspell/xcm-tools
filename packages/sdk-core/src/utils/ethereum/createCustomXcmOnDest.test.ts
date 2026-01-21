import { isChainEvm } from '@paraspell/assets'
import type { TChain, TLocation } from '@paraspell/sdk-common'
import { Parents, Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { MissingParameterError } from '../../errors'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { createCustomXcmOnDest } from './createCustomXcmOnDest'

vi.mock('@paraspell/assets')

vi.mock('../location', () => ({
  createBeneficiaryLocation: vi.fn(() => 'mockedBeneficiary')
}))

vi.mock('../assertions')

vi.mock('../../pallets/xcmPallet/utils', () => ({
  createDestination: vi.fn(() => ({}))
}))

describe('createCustomXcmOnDest', () => {
  const api = {} as unknown as IPolkadotApi<unknown, unknown>

  const mockChain: TChain = 'Acala'
  const version = Version.V4
  const messageId = 'test-message-id'

  const mockLocation: TLocation = {
    parents: Parents.TWO,
    interior: {
      X1: [
        {
          GlobalConsensus: {
            Ethereum: {
              chainId: 1
            }
          }
        }
      ]
    }
  }
  const mockBeneficiary = mockLocation
  const mockAsset = { id: mockLocation, fun: { Fungible: 1n } }
  const defaultDestination = { parents: Parents.ONE, interior: { Here: null } }
  const baseOptions = {
    api,
    address: '0xRecipient',
    scenario: 'ParaToPara',
    senderAddress: '0xSender',
    beneficiaryLocation: mockBeneficiary,
    asset: mockAsset,
    assetInfo: { location: mockLocation },
    destination: defaultDestination,
    version,
    ahAddress: '0xAh'
  } as Partial<TPolkadotXCMTransferOptions<unknown, unknown>>

  const ethLocation: TLocation = {
    parents: Parents.TWO,
    interior: {
      X2: [
        {
          GlobalConsensus: {
            Ethereum: {
              chainId: 1n
            }
          }
        },
        {
          AccountKey20: {
            network: null,
            key: '0xethAsset'
          }
        }
      ]
    }
  }

  const ethAsset = {
    symbol: 'WETH',
    decimals: 18,
    assetId: '0xethAsset',
    location: ethLocation
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(isChainEvm).mockReturnValue(false)
  })

  it('should throw an error if chain is EVM and ahAddress is missing', () => {
    const options = {
      ...baseOptions,
      ahAddress: undefined
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    vi.mocked(isChainEvm).mockReturnValue(true)

    expect(() => createCustomXcmOnDest(options, mockChain, messageId, ethAsset)).toThrow(
      MissingParameterError
    )

    vi.mocked(isChainEvm).mockReturnValue(false)
  })

  it('should return a valid XCM message structure', () => {
    const result = createCustomXcmOnDest(
      baseOptions as TPolkadotXCMTransferOptions<unknown, unknown>,
      mockChain,
      messageId,
      ethAsset
    )

    expect(result).toEqual({
      [version]: [
        {
          SetAppendix: [
            {
              DepositAsset: {
                assets: { Wild: 'All' },
                beneficiary: 'mockedBeneficiary'
              }
            }
          ]
        },
        {
          InitiateReserveWithdraw: {
            assets: {
              Wild: {
                AllOf: { id: ethLocation, fun: 'Fungible' }
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
                      interior: {
                        X1: [
                          {
                            AccountKey20: {
                              network: null,
                              key: ethAsset.assetId
                            }
                          }
                        ]
                      }
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
                      X1: [
                        {
                          AccountKey20: {
                            network: null,
                            key: baseOptions.address
                          }
                        }
                      ]
                    }
                  }
                }
              },
              {
                SetTopic: messageId
              }
            ]
          }
        },
        {
          SetTopic: messageId
        }
      ]
    })
  })
})

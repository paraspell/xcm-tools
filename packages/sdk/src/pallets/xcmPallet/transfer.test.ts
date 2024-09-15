// Tests designed to try different XCM Pallet XCM messages and errors

import { type ApiPromise } from '@polkadot/api'
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { NODE_NAMES, NODE_NAMES_DOT_KSM } from '../../maps/consts'
import { getAllAssetsSymbols, getOtherAssets, getRelayChainSymbol } from '../assets'
import { InvalidCurrencyError } from '../../errors/InvalidCurrencyError'
import { DuplicateAssetError, IncompatibleNodesError } from '../../errors'
import {
  type TSendOptions,
  type TNode,
  type TMultiAsset,
  type TMultiLocation,
  Extrinsic
} from '../../types'
import { send } from './transfer'
import ParachainNode from '../../nodes/ParachainNode'
import { createApiInstance, getNode } from '../../utils'
import Astar from '../../nodes/supported/Astar'
import Shiden from '../../nodes/supported/Shiden'

vi.spyOn(ParachainNode.prototype, 'transfer').mockReturnValue({} as Extrinsic)
vi.spyOn(Astar.prototype, 'transfer').mockReturnValue({} as Extrinsic)
vi.spyOn(Shiden.prototype, 'transfer').mockReturnValue({} as Extrinsic)

const WS_URL = 'wss://subsocial-rpc.dwellir.com'
const randomCurrencySymbol = 'DOT'

const MOCK_OPTIONS_BASE = {
  amount: 1000,
  address: '23sxrMSmaUMqe2ufSJg8U3Y8kxHfKT67YbubwXWFazpYi7w6'
}

describe('send', () => {
  let api: ApiPromise
  let polkadotNodes: TNode[]
  let kusamaNodes: TNode[]
  let sendOptions: TSendOptions

  beforeEach(async () => {
    api = await createApiInstance(WS_URL)
    polkadotNodes = NODE_NAMES_DOT_KSM.filter(node => getRelayChainSymbol(node) === 'KSM')
    kusamaNodes = NODE_NAMES_DOT_KSM.filter(node => getRelayChainSymbol(node) === 'DOT')
    sendOptions = {
      ...MOCK_OPTIONS_BASE,
      origin: 'Acala',
      currency: { symbol: 'ACA' },
      api
    }
  })

  it('should throw an InvalidCurrencyError when passing Acala and UNIT', async () => {
    await expect(
      send({
        ...sendOptions,
        origin: 'Acala',
        currency: { symbol: 'UNIT' }
      })
    ).rejects.toThrowError(InvalidCurrencyError)
  })

  it('should not throw an InvalidCurrencyError when passing Acala and ACA', async () => {
    await expect(
      send({ ...sendOptions, origin: 'Acala', currency: { symbol: 'ACA' } })
    ).resolves.not.toThrowError(InvalidCurrencyError)
  })

  it('should not throw an InvalidCurrencyError when passing Acala and ACA and Unique as destination', async () => {
    await expect(
      send({ ...sendOptions, origin: 'Acala', currency: { symbol: 'UNQ' }, destination: 'Unique' })
    ).resolves.not.toThrowError(InvalidCurrencyError)
  })

  it('should not throw an InvalidCurrencyError when passing Karura and BSX and Basilisk as destination', async () => {
    await expect(
      send({
        ...sendOptions,
        origin: 'Karura',
        currency: { symbol: 'BSX' },
        destination: 'Basilisk'
      })
    ).resolves.not.toThrowError(InvalidCurrencyError)
  })

  it('should throw an InvalidCurrencyError when passing Acala and ACA and BifrostPolkadot as destination', async () => {
    await expect(
      send({
        ...sendOptions,
        origin: 'Acala',
        currency: { symbol: 'UNQ' },
        destination: 'BifrostPolkadot'
      })
    ).rejects.toThrowError(InvalidCurrencyError)
  })

  it('should throw an IncompatibleNodesError when passing AssetHubKusama, DOT and Hydration as destination', async () => {
    await expect(
      send({
        ...sendOptions,
        origin: 'AssetHubKusama',
        currency: { symbol: 'DOT' },
        destination: 'Hydration'
      })
    ).rejects.toThrowError(IncompatibleNodesError)
  })

  it('should throw an IncompatibleNodesError when passing Hydration, DOT and AssetHubKusama as destination', async () => {
    await expect(
      send({
        ...sendOptions,
        origin: 'Hydration',
        currency: { symbol: 'DOT' },
        destination: 'AssetHubKusama'
      })
    ).rejects.toThrowError(IncompatibleNodesError)
  })

  it('should not throw an InvalidCurrencyError when passing all defined symbols from all nodes', async () => {
    for (const node of NODE_NAMES) {
      if (getNode(node).assetCheckEnabled) {
        const symbols = getAllAssetsSymbols(node)
        for (const symbol of symbols) {
          const otherAssetsMatches = getOtherAssets(node).filter(
            ({ symbol: assetSymbol }) => assetSymbol?.toLowerCase() === symbol.toLowerCase()
          )
          if (otherAssetsMatches.length > 1) {
            continue
          }
          await expect(
            send({ ...sendOptions, origin: node, currency: { symbol } })
          ).resolves.not.toThrowError(InvalidCurrencyError)
        }
      }
    }
  })

  it('should throw an IncompatibleNodesError when passing all nodes which have different relaychains', async () => {
    for (const polkadotNode of polkadotNodes) {
      for (const kusamaNode of kusamaNodes) {
        // Ignore these cases because they are using bridge
        if (
          (polkadotNode === 'AssetHubPolkadot' && kusamaNode === 'AssetHubKusama') ||
          (polkadotNode === 'AssetHubKusama' && kusamaNode === 'AssetHubPolkadot')
        ) {
          continue
        }

        await expect(
          send({
            ...sendOptions,
            origin: polkadotNode,
            currency: { symbol: randomCurrencySymbol },
            destination: kusamaNode
          })
        ).rejects.toThrowError(IncompatibleNodesError)
      }
    }
  })

  it('should not throw an IncompatibleNodesError when passing nodes which have the same relaychains', async () => {
    await expect(
      send({
        ...sendOptions,
        origin: 'Acala',
        currency: { symbol: randomCurrencySymbol },
        destination: 'Hydration'
      })
    ).resolves.not.toThrowError(IncompatibleNodesError)

    await expect(
      send({
        ...sendOptions,
        origin: 'AssetHubKusama',
        currency: { symbol: 'KSM' },
        destination: 'CrustShadow'
      })
    ).resolves.not.toThrowError(IncompatibleNodesError)
  })

  it('should throw InvalidCurrencyError when multi assets array is empty', async () => {
    const options = {
      api,
      origin: 'AssetHubPolkadot' as TNode,
      destination: 'Hydration' as TNode,
      currency: { multiasset: [] },
      feeAsset: 0,
      amount: 1000,
      address: '0x123'
    }

    await expect(send(options)).rejects.toThrow(InvalidCurrencyError)
    await expect(send(options)).rejects.toThrow('Overrided multi assets cannot be empty')
  })

  it('should throw DuplicateAssetError when Hydration and USDT is passed', async () => {
    const options = {
      api,
      origin: 'Hydration' as TNode,
      destination: 'Acala' as TNode,
      currency: { symbol: 'USDT' },
      feeAsset: 0,
      amount: 1000,
      address: '0x123'
    }

    await expect(send(options)).rejects.toThrow(DuplicateAssetError)
  })

  it('should not throw DuplicateAssetError when AssetHubPolkadot and WETH is passed', async () => {
    const options = {
      api,
      origin: 'AssetHubPolkadot' as TNode,
      destination: 'Hydration' as TNode,
      currency: { symbol: 'WETH' },
      feeAsset: 0,
      amount: 1000,
      address: '0x123'
    }

    await expect(send(options)).resolves.not.toThrow(DuplicateAssetError)
  })

  it('should throw InvalidCurrencyError when single multi asset is used with fee asset', async () => {
    const options = {
      api,
      origin: 'AssetHubPolkadot' as TNode,
      destination: 'Hydration' as TNode,
      currency: {
        multiasset: [
          {
            id: {
              Concrete: {
                parents: 0,
                interior: {
                  X2: [{ PalletInstance: '50' }, { Parachain: '30' }]
                }
              }
            },
            fun: { Fungible: 1000 }
          }
        ] as TMultiAsset[]
      },
      feeAsset: 1,
      amount: 1000,
      address: '0x456'
    }

    await expect(send(options)).rejects.toThrow(InvalidCurrencyError)
  })

  it('should throw InvalidCurrencyError when single multi location is used with fee asset', async () => {
    const multilocation: TMultiLocation = {
      parents: 0,
      interior: {
        X2: [{ PalletInstance: '50' }, { Parachain: '30' }]
      }
    }

    const options = {
      api,
      origin: 'AssetHubPolkadot' as TNode,
      destination: 'Hydration' as TNode,
      currency: { multilocation },
      feeAsset: 1,
      amount: 1000,
      address: '0x456'
    }

    await expect(send(options)).rejects.toThrow(InvalidCurrencyError)
  })

  it('should throw InvalidCurrencyError when multi assets are used without specifying fee asset', async () => {
    const options = {
      api,
      origin: 'AssetHubPolkadot' as TNode,
      destination: 'Hydration' as TNode,
      currency: {
        multiasset: [
          {
            id: {
              Concrete: {
                parents: 0,
                interior: {
                  X2: [{ PalletInstance: '50' }, { Parachain: '30' }]
                }
              }
            },
            fun: { Fungible: 1000 }
          },
          {
            id: {
              Concrete: {
                parents: 0,
                interior: {
                  X2: [{ PalletInstance: '50' }, { Parachain: '30' }]
                }
              }
            },
            fun: { Fungible: 500 }
          }
        ] as TMultiAsset[]
      },
      feeAsset: undefined,
      amount: 1000,
      address: '0x789'
    }

    await expect(send(options)).rejects.toThrow(InvalidCurrencyError)
  })

  it('should throw InvalidCurrencyError when multi assets are used without specifying fee asset', async () => {
    const options = {
      api,
      origin: 'AssetHubPolkadot' as TNode,
      destination: 'Hydration' as TNode,
      currency: {
        multiasset: [
          {
            id: {
              Concrete: {
                parents: 0,
                interior: {
                  X2: [{ PalletInstance: '50' }, { Parachain: '30' }]
                }
              }
            },
            fun: { Fungible: 1000 }
          },
          {
            id: {
              Concrete: {
                parents: 0,
                interior: {
                  X2: [{ PalletInstance: '50' }, { Parachain: '30' }]
                }
              }
            },
            fun: { Fungible: 500 }
          }
        ] as TMultiAsset[]
      },
      feeAsset: 1,
      amount: 1000,
      address: '0x789'
    }

    await expect(send(options)).resolves.not.toThrow()
  })

  it('should throw InvalidCurrencyError when multi assets are used without specifying fee asset', async () => {
    const options = {
      api,
      origin: 'AssetHubPolkadot' as TNode,
      destination: 'Hydration' as TNode,
      currency: {
        multiasset: [
          {
            id: {
              Concrete: {
                parents: 0,
                interior: {
                  X2: [{ PalletInstance: '50' }, { Parachain: '30' }]
                }
              }
            },
            fun: { Fungible: 1000 }
          },
          {
            id: {
              Concrete: {
                parents: 0,
                interior: {
                  X2: [{ PalletInstance: '50' }, { Parachain: '30' }]
                }
              }
            },
            fun: { Fungible: 500 }
          }
        ] as TMultiAsset[]
      },
      feeAsset: 0,
      amount: 1000,
      address: '0x789'
    }

    await expect(send(options)).resolves.not.toThrow()
  })

  it('should throw InvalidCurrencyError when multi assets are used with fee asset too big', async () => {
    const options = {
      api,
      origin: 'AssetHubPolkadot' as TNode,
      destination: 'Hydration' as TNode,
      currency: {
        multiasset: [
          {
            id: {
              Concrete: {
                parents: 0,
                interior: {
                  X2: [{ PalletInstance: '50' }, { Parachain: '30' }]
                }
              }
            },
            fun: { Fungible: 1000 }
          },
          {
            id: {
              Concrete: {
                parents: 0,
                interior: {
                  X2: [{ PalletInstance: '50' }, { Parachain: '30' }]
                }
              }
            },
            fun: { Fungible: 500 }
          }
        ] as TMultiAsset[]
      },
      feeAsset: -1,
      amount: 1000,
      address: '0x789'
    }

    await expect(send(options)).rejects.toThrow(InvalidCurrencyError)
  })

  it('should throw InvalidCurrencyError when multi assets are used with fee asset too big', async () => {
    const options = {
      api,
      origin: 'AssetHubPolkadot' as TNode,
      destination: 'Hydration' as TNode,
      currency: {
        multiasset: [
          {
            id: {
              Concrete: {
                parents: 0,
                interior: {
                  X2: [{ PalletInstance: '50' }, { Parachain: '30' }]
                }
              }
            },
            fun: { Fungible: 1000 }
          },
          {
            id: {
              Concrete: {
                parents: 0,
                interior: {
                  X2: [{ PalletInstance: '50' }, { Parachain: '30' }]
                }
              }
            },
            fun: { Fungible: 500 }
          }
        ] as TMultiAsset[]
      },
      feeAsset: 2,
      amount: 1000,
      address: '0x789'
    }

    await expect(send(options)).rejects.toThrow(InvalidCurrencyError)
  })
})

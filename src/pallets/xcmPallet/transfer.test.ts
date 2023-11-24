// Tests designed to try different XCM Pallet XCM messages and errors

import { type ApiPromise } from '@polkadot/api'
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { NODE_NAMES } from '../../maps/consts'
import { getAllAssetsSymbols, getRelayChainSymbol } from '../assets'
import { InvalidCurrencyError } from '../../errors/InvalidCurrencyError'
import { IncompatibleNodesError } from '../../errors'
import { type TNode } from '../../types'
import { send } from './transfer'
import ParachainNode from '../../nodes/ParachainNode'
import { createApiInstance, getNode } from '../../utils'

vi.spyOn(ParachainNode.prototype, 'transfer').mockImplementation(
  (
    api: ApiPromise,
    currencySymbol: string | undefined,
    currencyId: string | undefined,
    amount: string,
    to: string,
    destination?: TNode,
    serializedApiCallEnabled = false
  ) => {
    return null as any
  }
)

const WS_URL = 'wss://para.f3joule.space'
const ADDRESS = '23sxrMSmaUMqe2ufSJg8U3Y8kxHfKT67YbubwXWFazpYi7w6'
const AMOUNT = 1000
const randomCurrencySymbol = 'DOT'

const createNodePairs = (nodes: TNode[]): any =>
  nodes
    .reduce((result: any[], _, index, array) => {
      if (index % 2 === 0) result.push(array.slice(index, index + 2))
      return result
    }, [])
    .filter(pair => pair.length > 1)

describe('send', () => {
  let api: ApiPromise
  let polkadotNodes: TNode[]
  let kusamaNodes: TNode[]

  beforeEach(async () => {
    api = await createApiInstance(WS_URL)
    polkadotNodes = NODE_NAMES.filter(node => getRelayChainSymbol(node) === 'KSM')
    kusamaNodes = NODE_NAMES.filter(node => getRelayChainSymbol(node) === 'DOT')
  })

  it('should throw an InvalidCurrencyError when passing Acala and UNIT', () => {
    const t = (): void => {
      send(api, 'Acala', 'UNIT', AMOUNT, ADDRESS)
    }
    expect(t).toThrowError(InvalidCurrencyError)
  })

  it('should not throw an InvalidCurrencyError when passing Acala and ACA', () => {
    const t = (): void => {
      send(api, 'Acala', 'ACA', AMOUNT, ADDRESS)
    }
    expect(t).not.toThrowError(InvalidCurrencyError)
  })

  it('should not throw an InvalidCurrencyError when passing Acala and ACA and Unique as destination', () => {
    const t = (): void => {
      send(api, 'Acala', 'UNQ', AMOUNT, ADDRESS, 'Unique')
    }
    expect(t).not.toThrowError(InvalidCurrencyError)
  })

  it('should not throw an InvalidCurrencyError when passing Karura and BSX and Basilisk as destination', () => {
    const t = (): void => {
      send(api, 'Karura', 'BSX', AMOUNT, ADDRESS, 'Basilisk')
    }
    expect(t).not.toThrowError(InvalidCurrencyError)
  })

  it('should throw an InvalidCurrencyError when passing Acala and ACA and BifrostPolkadot as destination', () => {
    const t = (): void => {
      send(api, 'Acala', 'UNQ', AMOUNT, ADDRESS, 'BifrostPolkadot')
    }
    expect(t).toThrowError(InvalidCurrencyError)
  })

  it('should throw an IncompatibleNodesError when passing AssetHubKusama, DOT and AssetHubPolkadot as destination', () => {
    const t = (): void => {
      send(api, 'AssetHubKusama', 'DOT', AMOUNT, ADDRESS, 'AssetHubPolkadot')
    }
    expect(t).toThrowError(IncompatibleNodesError)
  })

  it('should throw an IncompatibleNodesError when passing AssetHubPolkadot, DOT and AssetHubKusama as destination', () => {
    const t = (): void => {
      send(api, 'AssetHubPolkadot', 'DOT', AMOUNT, ADDRESS, 'AssetHubKusama')
    }
    expect(t).toThrowError(IncompatibleNodesError)
  })

  it('should not throw an InvalidCurrencyError when passing all defined symbols from all nodes', () => {
    NODE_NAMES.forEach(node => {
      if (getNode(node).assetCheckEnabled) {
        const symbols = getAllAssetsSymbols(node)
        symbols.forEach(symbol => {
          const t = (): void => {
            send(api, node, symbol, AMOUNT, ADDRESS)
          }
          expect(t).not.toThrowError(InvalidCurrencyError)
        })
      }
    })
  })

  it('should throw an IncompatibleNodesError when passing all nodes which have different relaychains', () => {
    polkadotNodes.forEach(polkadotNode => {
      kusamaNodes.forEach(kusamaNode => {
        const t = (): void => {
          send(api, polkadotNode, randomCurrencySymbol, AMOUNT, ADDRESS, kusamaNode)
        }
        expect(t).toThrowError(IncompatibleNodesError)
      })
    })
  })

  it('should not throw an IncompatibleNodesError when passing all nodes which have the same relaychains', () => {
    const polkadotNodePairs = createNodePairs(polkadotNodes)
    const kusamaNodePairs = createNodePairs(kusamaNodes)

    polkadotNodePairs.forEach(([node, otherNode]: [TNode, TNode]) => {
      const t = (): void => {
        send(api, node, randomCurrencySymbol, AMOUNT, ADDRESS, otherNode)
      }
      expect(t).not.toThrowError(IncompatibleNodesError)
    })

    kusamaNodePairs.forEach(([node, otherNode]: [TNode, TNode]) => {
      const t = (): void => {
        send(api, node, randomCurrencySymbol, AMOUNT, ADDRESS, otherNode)
      }
      expect(t).not.toThrowError(IncompatibleNodesError)
    })
  })
})

// Tests designed to try different XCM Pallet XCM messages and errors

import { ApiPromise } from '@polkadot/api'
import { vi, describe, expect, it, beforeEach } from 'vitest'
import { NODE_NAMES } from '../../maps/consts'
import { createApiInstance } from '../../utils'
import { getAllAssetsSymbols, getRelayChainSymbol } from '../assets'
import { InvalidCurrencyError } from '../../errors/InvalidCurrencyError'
import { IncompatibleNodesError } from '../../errors'
import { TNode } from '../../types'
import { send } from './transfer'

vi.mock('../../utils', () => ({
  constructXTokens: vi.fn(),
  constructPolkadotXCM: vi.fn(),
  createApiInstance: vi.fn()
}))

const WS_URL = 'wss://para.f3joule.space'
const ADDRESS = '23sxrMSmaUMqe2ufSJg8U3Y8kxHfKT67YbubwXWFazpYi7w6'
const AMOUNT = 1000
const randomCurrencySymbol = 'DOT'

const createNodePairs = (nodes: TNode[]) =>
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
    const t = () => {
      send(api, 'Acala', 'UNIT', AMOUNT, ADDRESS)
    }
    expect(t).toThrowError(InvalidCurrencyError)
  })

  it('should not throw an InvalidCurrencyError when passing Acala and ACA', () => {
    const t = () => {
      send(api, 'Acala', 'ACA', AMOUNT, ADDRESS)
    }
    expect(t).not.toThrowError(InvalidCurrencyError)
  })

  it('should not throw an InvalidCurrencyError when passing Acala and ACA and Unique as destination', () => {
    const t = () => {
      send(api, 'Acala', 'UNQ', AMOUNT, ADDRESS, 'Unique')
    }
    expect(t).not.toThrowError(InvalidCurrencyError)
  })

  it('should not throw an InvalidCurrencyError when passing Karura and BSX and Basilisk as destination', () => {
    const t = () => {
      send(api, 'Karura', 'BSX', AMOUNT, ADDRESS, 'Basilisk')
    }
    expect(t).not.toThrowError(InvalidCurrencyError)
  })

  it('should throw an InvalidCurrencyError when passing Acala and ACA and BifrostPolkadot as destination', () => {
    const t = () => {
      send(api, 'Acala', 'UNQ', AMOUNT, ADDRESS, 'BifrostPolkadot')
    }
    expect(t).toThrowError(InvalidCurrencyError)
  })

  it('should throw an IncompatibleNodesError when passing AssetHubKusama, DOT and AssetHubPolkadot as destination', () => {
    const t = () => {
      send(api, 'AssetHubKusama', 'DOT', AMOUNT, ADDRESS, 'AssetHubPolkadot')
    }
    expect(t).toThrowError(IncompatibleNodesError)
  })

  it('should throw an IncompatibleNodesError when passing AssetHubPolkadot, DOT and AssetHubKusama as destination', () => {
    const t = () => {
      send(api, 'AssetHubPolkadot', 'DOT', AMOUNT, ADDRESS, 'AssetHubKusama')
    }
    expect(t).toThrowError(IncompatibleNodesError)
  })

  it('should not throw an InvalidCurrencyError when passing all defined symbols from all nodes', () => {
    NODE_NAMES.forEach(node => {
      const symbols = getAllAssetsSymbols(node)
      symbols.forEach(symbol => {
        if (symbol) {
          const t = () => {
            send(api, node, symbol, AMOUNT, ADDRESS)
          }
          expect(t).not.toThrowError(InvalidCurrencyError)
        }
      })
    })
  })

  it('should throw an IncompatibleNodesError when passing all nodes which have different relaychains', () => {
    polkadotNodes.forEach(polkadotNode => {
      kusamaNodes.forEach(kusamaNode => {
        const t = () => {
          send(api, polkadotNode, randomCurrencySymbol, AMOUNT, ADDRESS, kusamaNode)
        }
        expect(t).toThrowError(IncompatibleNodesError)
      })
    })
  })

  it('should not throw an IncompatibleNodesError when passing all nodes which have the same relaychains', () => {
    const polkadotNodePairs = createNodePairs(polkadotNodes)
    const kusamaNodePairs = createNodePairs(kusamaNodes)

    polkadotNodePairs.forEach(([node, otherNode]) => {
      const t = () => {
        send(api, node, randomCurrencySymbol, AMOUNT, ADDRESS, otherNode)
      }
      expect(t).not.toThrowError(IncompatibleNodesError)
    })

    kusamaNodePairs.forEach(([node, otherNode]) => {
      const t = () => {
        send(api, node, randomCurrencySymbol, AMOUNT, ADDRESS, otherNode)
      }
      expect(t).not.toThrowError(IncompatibleNodesError)
    })
  })
})

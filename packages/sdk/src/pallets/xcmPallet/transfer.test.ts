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
import Astar from '../../nodes/supported/Astar'
import Shiden from '../../nodes/supported/Shiden'

vi.spyOn(ParachainNode.prototype, 'transfer').mockReturnValue(null as any)
vi.spyOn(Astar.prototype, 'transfer').mockReturnValue(null as any)
vi.spyOn(Shiden.prototype, 'transfer').mockReturnValue(null as any)

const WS_URL = 'wss://para.f3joule.space'
const ADDRESS = '23sxrMSmaUMqe2ufSJg8U3Y8kxHfKT67YbubwXWFazpYi7w6'
const AMOUNT = 1000
const randomCurrencySymbol = 'DOT'

describe('send', () => {
  let api: ApiPromise
  let polkadotNodes: TNode[]
  let kusamaNodes: TNode[]

  beforeEach(async () => {
    api = await createApiInstance(WS_URL)
    polkadotNodes = NODE_NAMES.filter(node => getRelayChainSymbol(node) === 'KSM')
    kusamaNodes = NODE_NAMES.filter(node => getRelayChainSymbol(node) === 'DOT')
  })

  it('should throw an InvalidCurrencyError when passing Acala and UNIT', async () => {
    await expect(send(api, 'Acala', 'UNIT', AMOUNT, ADDRESS)).rejects.toThrowError(
      InvalidCurrencyError
    )
  })

  it('should not throw an InvalidCurrencyError when passing Acala and ACA', async () => {
    await expect(send(api, 'Acala', 'ACA', AMOUNT, ADDRESS)).resolves.not.toThrowError(
      InvalidCurrencyError
    )
  })

  it('should not throw an InvalidCurrencyError when passing Acala and ACA and Unique as destination', async () => {
    await expect(send(api, 'Acala', 'UNQ', AMOUNT, ADDRESS, 'Unique')).resolves.not.toThrowError(
      InvalidCurrencyError
    )
  })

  it('should not throw an InvalidCurrencyError when passing Karura and BSX and Basilisk as destination', async () => {
    await expect(send(api, 'Karura', 'BSX', AMOUNT, ADDRESS, 'Basilisk')).resolves.not.toThrowError(
      InvalidCurrencyError
    )
  })

  it('should throw an InvalidCurrencyError when passing Acala and ACA and BifrostPolkadot as destination', async () => {
    await expect(
      send(api, 'Acala', 'UNQ', AMOUNT, ADDRESS, 'BifrostPolkadot')
    ).rejects.toThrowError(InvalidCurrencyError)
  })

  it('should throw an IncompatibleNodesError when passing AssetHubKusama, DOT and AssetHubPolkadot as destination', async () => {
    await expect(
      send(api, 'AssetHubKusama', 'DOT', AMOUNT, ADDRESS, 'AssetHubPolkadot')
    ).rejects.toThrowError(IncompatibleNodesError)
  })

  it('should throw an IncompatibleNodesError when passing AssetHubPolkadot, DOT and AssetHubKusama as destination', async () => {
    await expect(
      send(api, 'AssetHubPolkadot', 'DOT', AMOUNT, ADDRESS, 'AssetHubKusama')
    ).rejects.toThrowError(IncompatibleNodesError)
  })

  it('should not throw an InvalidCurrencyError when passing all defined symbols from all nodes', async () => {
    for (const node of NODE_NAMES) {
      if (getNode(node).assetCheckEnabled) {
        const symbols = getAllAssetsSymbols(node)
        for (const symbol of symbols) {
          await expect(send(api, node, symbol, AMOUNT, ADDRESS)).resolves.not.toThrowError(
            InvalidCurrencyError
          )
        }
      }
    }
  })

  it('should throw an IncompatibleNodesError when passing all nodes which have different relaychains', async () => {
    for (const polkadotNode of polkadotNodes) {
      for (const kusamaNode of kusamaNodes) {
        await expect(
          send(api, polkadotNode, randomCurrencySymbol, AMOUNT, ADDRESS, kusamaNode)
        ).rejects.toThrowError(IncompatibleNodesError)
      }
    }
  })

  it('should not throw an IncompatibleNodesError when passing nodes which have the same relaychains', async () => {
    await expect(
      send(api, 'Acala', randomCurrencySymbol, AMOUNT, ADDRESS, 'HydraDX')
    ).resolves.not.toThrowError(IncompatibleNodesError)

    await expect(
      send(api, 'AssetHubKusama', 'KSM', AMOUNT, ADDRESS, 'CrustShadow')
    ).resolves.not.toThrowError(IncompatibleNodesError)
  })
})

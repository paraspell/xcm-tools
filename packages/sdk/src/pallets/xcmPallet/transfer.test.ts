// Tests designed to try different XCM Pallet XCM messages and errors

import { type ApiPromise } from '@polkadot/api'
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { NODE_NAMES } from '../../maps/consts'
import { getAllAssetsSymbols, getRelayChainSymbol } from '../assets'
import { InvalidCurrencyError } from '../../errors/InvalidCurrencyError'
import { IncompatibleNodesError } from '../../errors'
import { type TSendOptions, type TNode } from '../../types'
import { send } from './transfer'
import ParachainNode from '../../nodes/ParachainNode'
import { createApiInstance, getNode } from '../../utils'
import Astar from '../../nodes/supported/Astar'
import Shiden from '../../nodes/supported/Shiden'

vi.spyOn(ParachainNode.prototype, 'transfer').mockReturnValue(null as any)
vi.spyOn(Astar.prototype, 'transfer').mockReturnValue(null as any)
vi.spyOn(Shiden.prototype, 'transfer').mockReturnValue(null as any)

const WS_URL = 'wss://para.f3joule.space'
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
    polkadotNodes = NODE_NAMES.filter(node => getRelayChainSymbol(node) === 'KSM')
    kusamaNodes = NODE_NAMES.filter(node => getRelayChainSymbol(node) === 'DOT')
    sendOptions = {
      ...MOCK_OPTIONS_BASE,
      origin: 'Acala',
      currency: 'ACA',
      api
    }
  })

  it('should throw an InvalidCurrencyError when passing Acala and UNIT', async () => {
    await expect(
      send({
        ...sendOptions,
        origin: 'Acala',
        currency: 'UNIT'
      })
    ).rejects.toThrowError(InvalidCurrencyError)
  })

  it('should not throw an InvalidCurrencyError when passing Acala and ACA', async () => {
    await expect(
      send({ ...sendOptions, origin: 'Acala', currency: 'ACA' })
    ).resolves.not.toThrowError(InvalidCurrencyError)
  })

  it('should not throw an InvalidCurrencyError when passing Acala and ACA and Unique as destination', async () => {
    await expect(
      send({ ...sendOptions, origin: 'Acala', currency: 'UNQ', destination: 'Unique' })
    ).resolves.not.toThrowError(InvalidCurrencyError)
  })

  it('should not throw an InvalidCurrencyError when passing Karura and BSX and Basilisk as destination', async () => {
    await expect(
      send({ ...sendOptions, origin: 'Karura', currency: 'BSX', destination: 'Basilisk' })
    ).resolves.not.toThrowError(InvalidCurrencyError)
  })

  it('should throw an InvalidCurrencyError when passing Acala and ACA and BifrostPolkadot as destination', async () => {
    await expect(
      send({ ...sendOptions, origin: 'Acala', currency: 'UNQ', destination: 'BifrostPolkadot' })
    ).rejects.toThrowError(InvalidCurrencyError)
  })

  it('should throw an IncompatibleNodesError when passing AssetHubKusama, DOT and AssetHubPolkadot as destination', async () => {
    await expect(
      send({
        ...sendOptions,
        origin: 'AssetHubKusama',
        currency: 'DOT',
        destination: 'AssetHubPolkadot'
      })
    ).rejects.toThrowError(IncompatibleNodesError)
  })

  it('should throw an IncompatibleNodesError when passing AssetHubPolkadot, DOT and AssetHubKusama as destination', async () => {
    await expect(
      send({
        ...sendOptions,
        origin: 'AssetHubPolkadot',
        currency: 'DOT',
        destination: 'AssetHubKusama'
      })
    ).rejects.toThrowError(IncompatibleNodesError)
  })

  it('should not throw an InvalidCurrencyError when passing all defined symbols from all nodes', async () => {
    for (const node of NODE_NAMES) {
      if (getNode(node).assetCheckEnabled) {
        const symbols = getAllAssetsSymbols(node)
        for (const symbol of symbols) {
          await expect(
            send({ ...sendOptions, origin: node, currency: symbol })
          ).resolves.not.toThrowError(InvalidCurrencyError)
        }
      }
    }
  })

  it('should throw an IncompatibleNodesError when passing all nodes which have different relaychains', async () => {
    for (const polkadotNode of polkadotNodes) {
      for (const kusamaNode of kusamaNodes) {
        await expect(
          send({
            ...sendOptions,
            origin: polkadotNode,
            currency: randomCurrencySymbol,
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
        currency: randomCurrencySymbol,
        destination: 'HydraDX'
      })
    ).resolves.not.toThrowError(IncompatibleNodesError)

    await expect(
      send({
        ...sendOptions,
        origin: 'AssetHubKusama',
        currency: 'KSM',
        destination: 'CrustShadow'
      })
    ).resolves.not.toThrowError(IncompatibleNodesError)
  })
})

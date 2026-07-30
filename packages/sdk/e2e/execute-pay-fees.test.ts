import '../../swap/src'

import { describe, it } from 'vitest'

import { Builder, Version } from '../src'
import {
  createExecuteTransferCases,
  DOT_LOCATION,
  EVM_TEST_ADDRESS,
  expectPayFeesProgram,
  TEST_ADDRESS,
  type TExecuteE2eCase,
  USDT_LOCATION
} from './execute-fees.utils'

const createBuilder = () => Builder({ xcmFormatCheck: true })

const transferCases = createExecuteTransferCases(Version.V5)

const swapDestinations = ['Moonbeam', 'BifrostPolkadot', 'Acala', 'Ajuna'] as const

const swapCases: TExecuteE2eCase[] = [
  {
    name: 'AssetHubPolkadot through a Hydration USDt to DOT swap',
    minFeeInstructions: 1,
    build: () =>
      createBuilder()
        .from('AssetHubPolkadot')
        .to('Hydration')
        .currency({ location: USDT_LOCATION, amount: 100 })
        .swap({ currencyTo: { location: DOT_LOCATION }, exchange: 'Hydration' })
        .sender(TEST_ADDRESS)
        .recipient(TEST_ADDRESS)
        .build()
  },
  {
    name: 'Hydration through an AssetHubPolkadot DOT to USDt swap',
    minFeeInstructions: 1,
    build: () =>
      createBuilder()
        .from('Hydration')
        .to('AssetHubPolkadot')
        .currency({ location: DOT_LOCATION, amount: 100 })
        .swap({ currencyTo: { location: USDT_LOCATION }, exchange: 'AssetHubPolkadot' })
        .sender(TEST_ADDRESS)
        .recipient(TEST_ADDRESS)
        .build()
  },
  {
    name: 'Hydration USDt to DOT swap ending on AssetHubPolkadot',
    minFeeInstructions: 1,
    build: () =>
      createBuilder()
        .from('Hydration')
        .to('AssetHubPolkadot')
        .currency({ location: USDT_LOCATION, amount: 100 })
        .swap({ currencyTo: { location: DOT_LOCATION }, exchange: 'Hydration' })
        .sender(TEST_ADDRESS)
        .recipient(TEST_ADDRESS)
        .build()
  },
  ...swapDestinations.map(destination => ({
    name: `Hydration USDt to DOT swap followed by a ${destination} transfer`,
    minFeeInstructions: 2,
    build: () =>
      createBuilder()
        .from('Hydration')
        .to(destination)
        .currency({ location: USDT_LOCATION, amount: 100 })
        .swap({ currencyTo: { location: DOT_LOCATION }, exchange: 'Hydration' })
        .sender(TEST_ADDRESS)
        .recipient(destination === 'Moonbeam' ? EVM_TEST_ADDRESS : TEST_ADDRESS)
        .build()
  })),
  ...swapDestinations
    .filter(destination => destination !== 'Acala')
    .map(destination => ({
      name: `AssetHubPolkadot USDt transfer, Hydration DOT swap, and ${destination} transfer`,
      minFeeInstructions: 2,
      build: () =>
        createBuilder()
          .from('AssetHubPolkadot')
          .to(destination)
          .currency({ location: USDT_LOCATION, amount: 100 })
          .swap({ currencyTo: { location: DOT_LOCATION }, exchange: 'Hydration' })
          .sender(TEST_ADDRESS)
          .recipient(destination === 'Moonbeam' ? EVM_TEST_ADDRESS : TEST_ADDRESS)
          .build()
    })),
  {
    name: 'Hydration DOT to USDt swap followed by an Acala transfer',
    minFeeInstructions: 2,
    build: () =>
      createBuilder()
        .from('Hydration')
        .to('Acala')
        .currency({ location: DOT_LOCATION, amount: 100 })
        .swap({ currencyTo: { location: USDT_LOCATION }, exchange: 'Hydration' })
        .sender(TEST_ADDRESS)
        .recipient(TEST_ADDRESS)
        .build()
  }
]

describe('V5 execute PayFees', () => {
  describe('transfers', () => {
    it.each(transferCases)('$name', async testCase => {
      const tx = await testCase.build()
      expectPayFeesProgram(
        tx,
        testCase.minFeeInstructions,
        testCase.minRefunds,
        testCase.expectRelayFeeAsset
      )
    })
  })

  describe('swaps', () => {
    it.each(swapCases)('$name', async testCase => {
      const tx = await testCase.build()
      expectPayFeesProgram(
        tx,
        testCase.minFeeInstructions,
        testCase.minRefunds,
        testCase.expectRelayFeeAsset
      )
    })
  })
})

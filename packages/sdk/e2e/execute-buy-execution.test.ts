import '../../swap/src'

import { describe, it } from 'vitest'

import { Builder, Version } from '../src'
import {
  createExecuteTransferCases,
  DOT_LOCATION,
  expectBuyExecutionProgram,
  HDX_LOCATION,
  TEST_ADDRESS,
  type TExecuteE2eCase,
  USDT_LOCATION
} from './execute-fees.utils'

const createBuilder = (xcmFormatCheck = true) => Builder({ xcmFormatCheck })

const transferCases = createExecuteTransferCases(Version.V4, ['Astar', 'Darwinia'])

const swapCases: TExecuteE2eCase[] = [
  {
    name: 'AssetHubPolkadot USDt to Hydration HDX swap ending on Zeitgeist without a destination format check',
    minFeeInstructions: 2,
    build: () =>
      createBuilder(false)
        .from('AssetHubPolkadot')
        .to('Zeitgeist')
        .currency({ location: USDT_LOCATION, amount: 100 })
        .swap({ currencyTo: { location: HDX_LOCATION }, exchange: 'Hydration' })
        .sender(TEST_ADDRESS)
        .recipient(TEST_ADDRESS)
        .build()
  },
  {
    name: 'Hydration DOT to HDX swap ending on Zeitgeist without a destination format check',
    minFeeInstructions: 1,
    build: () =>
      createBuilder(false)
        .from('Hydration')
        .to('Zeitgeist')
        .currency({ location: DOT_LOCATION, amount: 100 })
        .swap({ currencyTo: { location: HDX_LOCATION }, exchange: 'Hydration' })
        .sender(TEST_ADDRESS)
        .recipient(TEST_ADDRESS)
        .build()
  },
  {
    name: 'Hydration DOT transfer, AssetHubPolkadot USDt swap, and Zeitgeist transfer without a destination format check',
    minFeeInstructions: 2,
    build: () =>
      createBuilder(false)
        .from('Hydration')
        .to('Zeitgeist')
        .currency({ location: DOT_LOCATION, amount: 100 })
        .swap({ currencyTo: { location: USDT_LOCATION }, exchange: 'AssetHubPolkadot' })
        .sender(TEST_ADDRESS)
        .recipient(TEST_ADDRESS)
        .build()
  },
  {
    name: 'AssetHubPolkadot USDt to DOT swap ending on NeuroWeb',
    minFeeInstructions: 3,
    build: () =>
      createBuilder()
        .from('AssetHubPolkadot')
        .to('NeuroWeb')
        .currency({ location: USDT_LOCATION, amount: 100 })
        .swap({ currencyTo: { location: DOT_LOCATION }, exchange: 'Hydration' })
        .sender(TEST_ADDRESS)
        .recipient(TEST_ADDRESS)
        .build()
  },
  {
    name: 'Hydration USDt to DOT swap ending on NeuroWeb',
    minFeeInstructions: 2,
    build: () =>
      createBuilder()
        .from('Hydration')
        .to('NeuroWeb')
        .currency({ location: USDT_LOCATION, amount: 100 })
        .swap({ currencyTo: { location: DOT_LOCATION }, exchange: 'Hydration' })
        .sender(TEST_ADDRESS)
        .recipient(TEST_ADDRESS)
        .build()
  },
  {
    name: 'Hydration USDt to DOT swap ending on Zeitgeist without a destination format check',
    minFeeInstructions: 2,
    build: () =>
      createBuilder(false)
        .from('Hydration')
        .to('Zeitgeist')
        .currency({ location: USDT_LOCATION, amount: 100 })
        .swap({ currencyTo: { location: DOT_LOCATION }, exchange: 'Hydration' })
        .sender(TEST_ADDRESS)
        .recipient(TEST_ADDRESS)
        .build()
  }
]

describe('Pre-V5 execute BuyExecution', () => {
  describe('transfers', () => {
    it.each(transferCases)('$name', async testCase => {
      const tx = await testCase.build()
      expectBuyExecutionProgram(tx, testCase.minFeeInstructions, testCase.expectRelayFeeAsset)
    })
  })

  describe('swaps', () => {
    it.each(swapCases)('$name', async testCase => {
      const tx = await testCase.build()
      expectBuyExecutionProgram(tx, testCase.minFeeInstructions, testCase.expectRelayFeeAsset)
    })
  })
})

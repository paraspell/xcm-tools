import '../../swap/src'

import { afterAll, describe, it } from 'vitest'

import {
  Builder,
  CHAINS,
  getSupportedDestinations,
  isChainEvm,
  type TChain,
  type TPapiTransaction
} from '../src'
import {
  DOT_LOCATION,
  EVM_TEST_ADDRESS,
  expectVersionedExecutionProgram,
  TEST_ADDRESS,
  type TExecutionVersion,
  USDT_LOCATION
} from './execute-fees.utils'

type TDiscoveryOperation = 'transfer' | 'swap'

type TDiscoveryCase = {
  name: string
  operation: TDiscoveryOperation
  origin: 'AssetHubPolkadot' | 'Hydration'
  destination: TChain
  feeMode: 'same-asset' | 'separate-dot' | 'swap-output'
  registrySupported: boolean
  build: () => Promise<TPapiTransaction>
}

type TDiscoveryResult = Omit<TDiscoveryCase, 'build'> & {
  error?: string
  success: boolean
  version?: TExecutionVersion
}

const results: TDiscoveryResult[] = []

const getResultDetails = ({
  name,
  operation,
  origin,
  destination,
  feeMode,
  registrySupported
}: TDiscoveryCase): Omit<TDiscoveryCase, 'build'> => ({
  name,
  operation,
  origin,
  destination,
  feeMode,
  registrySupported
})

const recipientFor = (chain: TChain) => (isChainEvm(chain) ? EVM_TEST_ADDRESS : TEST_ADDRESS)

const supportedTransferDestinations = {
  AssetHubPolkadot: getSupportedDestinations('AssetHubPolkadot', {
    location: USDT_LOCATION
  }),
  Hydration: getSupportedDestinations('Hydration', { location: USDT_LOCATION })
}

const supportedTransferPairs = (
  Object.entries(supportedTransferDestinations) as Array<
    ['AssetHubPolkadot' | 'Hydration', TChain[]]
  >
).flatMap(([origin, destinations]) => destinations.map(destination => ({ origin, destination })))

const supportedTransferChains = new Set(
  supportedTransferPairs.map(({ destination }) => destination)
)

const transferCases: TDiscoveryCase[] = supportedTransferPairs.flatMap(({ origin, destination }) =>
  (['same-asset', 'separate-dot'] as const).map(feeMode => ({
    name: `${origin} to ${destination} ${feeMode}`,
    operation: 'transfer' as const,
    origin,
    destination,
    feeMode,
    registrySupported: true,
    build: () =>
      Builder({ xcmFormatCheck: true })
        .from(origin)
        .to(destination)
        .currency({ location: USDT_LOCATION, amount: 100 })
        .feeAsset({ location: feeMode === 'separate-dot' ? DOT_LOCATION : USDT_LOCATION })
        .sender(TEST_ADDRESS)
        .recipient(recipientFor(destination))
        .build()
  }))
)

const unsupportedTransferCases: TDiscoveryCase[] = CHAINS.filter(
  destination => !supportedTransferChains.has(destination)
).map(destination => ({
  name: `AssetHubPolkadot to ${destination} registry-unsupported`,
  operation: 'transfer',
  origin: 'AssetHubPolkadot',
  destination,
  feeMode: 'same-asset',
  registrySupported: false,
  build: () =>
    Builder({ xcmFormatCheck: true })
      .from('AssetHubPolkadot')
      .to(destination)
      .currency({ location: USDT_LOCATION, amount: 100 })
      .feeAsset({ location: USDT_LOCATION })
      .sender(TEST_ADDRESS)
      .recipient(recipientFor(destination))
      .build()
}))

const swapCases: TDiscoveryCase[] = getSupportedDestinations('Hydration', {
  location: DOT_LOCATION
}).map(destination => ({
  name: `Hydration USDt to DOT swap ending on ${destination}`,
  operation: 'swap',
  origin: 'Hydration',
  destination,
  feeMode: 'swap-output',
  registrySupported: true,
  build: () =>
    Builder({ xcmFormatCheck: true })
      .from('Hydration')
      .to(destination)
      .currency({ location: USDT_LOCATION, amount: 100 })
      .swap({ currencyTo: { location: DOT_LOCATION }, exchange: 'Hydration' })
      .sender(TEST_ADDRESS)
      .recipient(recipientFor(destination))
      .build()
}))

const runCase = async (testCase: TDiscoveryCase) => {
  const details = getResultDetails(testCase)

  try {
    const tx = await testCase.build()
    const version = expectVersionedExecutionProgram(tx)
    results.push({ ...details, success: true, version })
  } catch (error) {
    results.push({
      ...details,
      success: false,
      error: error instanceof Error ? `${error.name}: ${error.message}` : String(error)
    })
  }
}

afterAll(() => {
  const successfulRoutes = results.filter(result => result.success)
  const failures = results.filter(result => !result.success)

  console.log(
    JSON.stringify(
      {
        summary: {
          attempted: results.length,
          failed: failures.length,
          succeeded: successfulRoutes.length
        },
        successfulRoutes,
        failures
      },
      null,
      2
    )
  )
})

describe('Execute route discovery', () => {
  describe('transfers', () => {
    it.each([...transferCases, ...unsupportedTransferCases])('$name', runCase)
  })

  describe('swaps', () => {
    it.each(swapCases)('$name', runCase)
  })
})

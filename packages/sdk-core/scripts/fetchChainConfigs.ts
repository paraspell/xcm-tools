/**
 * Fetches the chains configurations from the @polkadot/apps-config repo and writes them to the configs.json file.
 */

import axios from 'axios'
import { Project, SyntaxKind, Node } from 'ts-morph'
import { writeFileSync } from 'fs'
import { SUBSTRATE_CHAINS } from '../src'
import { getChain } from '../src/utils'
import type { TChainConfig, TProviderEntry, TSubstrateChain } from '../src'

const PAPI_CONSOLE_POLKADOT_URL =
  'https://raw.githubusercontent.com/polkadot-api/papi-console/refs/heads/main/src/state/chains/networks/polkadot.json'

const overrides: Partial<Record<TSubstrateChain, TProviderEntry[]>> = {
  Peaq: [
    {
      name: 'OnFinality',
      endpoint: 'wss://peaq.api.onfinality.io/public-ws'
    }
  ],
  EnergyWebX: [
    {
      name: 'Energy Web',
      endpoint: 'wss://wnp-rpc.mainnet.energywebx.com/'
    }
  ]
}

type TModifiedChainConfig = TChainConfig & {
  relayChain: string | undefined
}

type TPapiConsoleChainConfig = {
  id: string
  rpcs: Record<string, string>
}

const fetchHydrationProviders = async (): Promise<TProviderEntry[]> => {
  const { data } = await axios.get<TPapiConsoleChainConfig[]>(PAPI_CONSOLE_POLKADOT_URL)
  const hydrationInfo = getChain('Hydration').info
  const rpcs = data.find(({ id }) => id === hydrationInfo)?.rpcs ?? {}

  return Object.entries(rpcs)
    .filter(([, endpoint]) => endpoint.startsWith('wss://'))
    .map(([name, endpoint]) => ({ name, endpoint }))
}

const mergeUniqueProviders = (
  providers: TProviderEntry[],
  additionalProviders: TProviderEntry[]
): TProviderEntry[] => [
  ...new Map(
    [...providers, ...additionalProviders].map(provider => [provider.endpoint, provider])
  ).values()
]

export const fetchRpcEndpoints = async (): Promise<void> => {
  const BASE_URL =
    'https://raw.githubusercontent.com/polkadot-js/apps/refs/heads/master/packages/apps-config/src/endpoints'

  const polkadotUrl = `${BASE_URL}/productionRelayPolkadot.ts`
  const kusamaUrl = `${BASE_URL}/productionRelayKusama.ts`
  const westendUrl = `${BASE_URL}/testingRelayWestend.ts`
  const paseoUrl = `${BASE_URL}/testingRelayPaseo.ts`

  const chainConfig: TModifiedChainConfig[] = []

  const processEndpointsFromUrl = async (url: string, relayChainName: string): Promise<void> => {
    const response = await axios.get(url)
    const code = response.data as string

    const project = new Project()
    const sourceFile = project.createSourceFile(`${relayChainName}.ts`, code)

    const parseProviders = (providersNode: Node): TProviderEntry[] => {
      const providerEntries: TProviderEntry[] = []

      providersNode.forEachChild(provider => {
        if (!Node.isPropertyAssignment(provider)) return

        const providerName = provider.getName().replace(/['"`]/g, '')
        const endpoint = provider
          .getInitializerIfKindOrThrow(SyntaxKind.StringLiteral)
          .getText()
          .replace(/['"`]/g, '')

        if (endpoint.startsWith('wss://')) {
          providerEntries.push({
            name: providerName,
            endpoint: endpoint
          })
        }
      })

      return providerEntries
    }

    const parseEndpointOption = (endpointOption: Node): TModifiedChainConfig | null => {
      if (!Node.isObjectLiteralExpression(endpointOption)) return null

      const textProp = endpointOption.getPropertyOrThrow('text')
      const chainName = textProp
        .getFirstDescendantByKindOrThrow(SyntaxKind.StringLiteral)
        .getText()
        .replace(/['"`]/g, '')

      const infoProp = endpointOption.getPropertyOrThrow('info')
      const info = infoProp
        .getFirstDescendantByKindOrThrow(SyntaxKind.StringLiteral)
        .getText()
        .replace(/['"`]/g, '')

      const providersProp = endpointOption.getPropertyOrThrow('providers')
      const providersValue = providersProp.getFirstDescendantByKindOrThrow(
        SyntaxKind.ObjectLiteralExpression
      )

      const paraIdProp = endpointOption.getProperty('paraId')
      const paraId = paraIdProp
        ? Number(paraIdProp.getFirstDescendantByKindOrThrow(SyntaxKind.NumericLiteral).getText())
        : undefined

      const providers = parseProviders(providersValue)

      return {
        name: chainName,
        info,
        paraId: paraId ?? 0,
        relayChain: relayChainName,
        providers
      }
    }

    const processEndpointOptions = (variableName: string): void => {
      const variableDeclaration = sourceFile.getVariableDeclarationOrThrow(variableName)
      const initializer = variableDeclaration.getInitializerOrThrow()

      if (Node.isArrayLiteralExpression(initializer)) {
        initializer.forEachChild(endpointOption => {
          const parsedOption = parseEndpointOption(endpointOption)
          if (parsedOption) {
            chainConfig.push(parsedOption)
          }
        })
      } else if (Node.isObjectLiteralExpression(initializer)) {
        const parsedOption = parseEndpointOption(initializer)
        if (parsedOption) {
          chainConfig.push(parsedOption)
        }
      }
    }

    if (relayChainName === 'Polkadot') {
      processEndpointOptions('prodParasPolkadot')
      processEndpointOptions('prodParasPolkadotCommon')
      processEndpointOptions('prodRelayPolkadot')
    } else if (relayChainName === 'Kusama') {
      processEndpointOptions('prodParasKusama')
      processEndpointOptions('prodParasKusamaCommon')
      processEndpointOptions('prodRelayKusama')
    } else if (relayChainName === 'Westend') {
      processEndpointOptions('testParasWestend')
      processEndpointOptions('testParasWestendCommon')
      processEndpointOptions('testRelayWestend')
    } else if (relayChainName === 'Paseo') {
      processEndpointOptions('testParasPaseo')
      processEndpointOptions('testParasPaseoCommon')
      processEndpointOptions('testRelayPaseo')
    }
  }

  await processEndpointsFromUrl(polkadotUrl, 'Polkadot')
  await processEndpointsFromUrl(kusamaUrl, 'Kusama')
  await processEndpointsFromUrl(westendUrl, 'Westend')
  await processEndpointsFromUrl(paseoUrl, 'Paseo')

  const chains = SUBSTRATE_CHAINS.map(chain => {
    return getChain(chain)
  })

  const hydrationProviders = await fetchHydrationProviders()

  const obj = {} as Record<TSubstrateChain, TModifiedChainConfig>

  chains.forEach(chain => {
    const config = chainConfig.find(c => c.info === chain.info && c.relayChain === chain.ecosystem)
    if (config) {
      const chainOverride = overrides[chain.chain]
      const providers = chainOverride ?? config.providers

      obj[chain.chain] = {
        ...config,
        relayChain: undefined,
        providers:
          chain.chain === 'Hydration'
            ? mergeUniqueProviders(providers, hydrationProviders)
            : providers
      }
    }
  })

  obj['Polkadot'].relayChain = undefined
  obj['Kusama'].relayChain = undefined
  obj['Westend'].relayChain = undefined
  obj['Paseo'].relayChain = undefined

  writeFileSync('./src/maps/configs.json', JSON.stringify(obj, null, 2))
}

void fetchRpcEndpoints()

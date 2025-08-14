/**
 * Fetches the chains configurations from the @polkadot/apps-config repo and writes them to the configs.json file.
 */

import axios from 'axios'
import { Project, SyntaxKind, Node } from 'ts-morph'
import { writeFileSync } from 'fs'
import { CHAIN_NAMES_DOT_KSM } from '../../src'
import { getChain } from '../../src/utils'
import type { TChainConfig, TProviderEntry, TChainDotKsmWithRelayChains } from '../../src'

type TModifiedChainConfig = TChainConfig & {
  relayChain: string | undefined
}

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

      const PEAQ_PARA_ID = 3338
      const HYDRATION_PARA_ID = 2034

      const providers =
        paraId === PEAQ_PARA_ID
          ? [
              {
                name: 'OnFinality',
                endpoint: 'wss://peaq.api.onfinality.io/public-ws'
              }
            ]
          : parseProviders(providersValue)

      // Filter out the non RPC compliant Hydration endpoint
      const filteredProviders =
        paraId === HYDRATION_PARA_ID && relayChainName !== 'paseo'
          ? providers.filter(p => p.name !== 'Galactic Council')
          : providers

      return {
        name: chainName,
        info,
        paraId: paraId ?? 0,
        relayChain: relayChainName,
        providers: filteredProviders
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

    if (relayChainName === 'polkadot') {
      processEndpointOptions('prodParasPolkadot')
      processEndpointOptions('prodParasPolkadotCommon')
      processEndpointOptions('prodRelayPolkadot')
    } else if (relayChainName === 'kusama') {
      processEndpointOptions('prodParasKusama')
      processEndpointOptions('prodParasKusamaCommon')
      processEndpointOptions('prodRelayKusama')
    } else if (relayChainName === 'westend') {
      processEndpointOptions('testParasWestend')
      processEndpointOptions('testParasWestendCommon')
      processEndpointOptions('testRelayWestend')
    } else if (relayChainName === 'paseo') {
      processEndpointOptions('testParasPaseo')
      processEndpointOptions('testParasPaseoCommon')
      processEndpointOptions('testRelayPaseo')
    }
  }

  await processEndpointsFromUrl(polkadotUrl, 'polkadot')
  await processEndpointsFromUrl(kusamaUrl, 'kusama')
  await processEndpointsFromUrl(westendUrl, 'westend')
  await processEndpointsFromUrl(paseoUrl, 'paseo')

  const chains = CHAIN_NAMES_DOT_KSM.map(chain => {
    return getChain(chain)
  })

  const obj = {} as Record<TChainDotKsmWithRelayChains, TModifiedChainConfig>

  chains.forEach(chain => {
    const config = chainConfig.find(c => c.info === chain.info && c.relayChain === chain.type)
    if (config) {
      obj[chain.chain] = {
        ...config,
        relayChain: undefined
      }
    }
  })

  obj['Polkadot'] = chainConfig.find(c => c.info === 'polkadot') as TModifiedChainConfig
  obj['Kusama'] = chainConfig.find(c => c.info === 'kusama') as TModifiedChainConfig
  obj['Westend'] = chainConfig.find(c => c.info === 'westend') as TModifiedChainConfig
  obj['Paseo'] = chainConfig.find(c => c.info === 'paseo') as TModifiedChainConfig

  obj['Polkadot'].relayChain = undefined
  obj['Kusama'].relayChain = undefined
  obj['Westend'].relayChain = undefined
  obj['Paseo'].relayChain = undefined

  writeFileSync('./src/maps/configs.json', JSON.stringify(obj, null, 2))
}

void fetchRpcEndpoints()

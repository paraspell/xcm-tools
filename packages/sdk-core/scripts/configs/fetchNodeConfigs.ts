/**
 * Fetches the node configurations from the \@polkadot/apps-config repo and writes them to the configs.json file.
 */

import axios from 'axios'
import { Project, SyntaxKind, Node } from 'ts-morph'
import { writeFileSync } from 'fs'
import { NODE_NAMES_DOT_KSM } from '../../src/constants'
import { getNode } from '../../src/utils'
import type { TNodeConfig, TProviderEntry, TNodeDotKsmWithRelayChains } from '../../src/types'

type TModifiedNodeConfig = TNodeConfig & {
  relayChain: string | undefined
}

export const fetchRpcEndpoints = async (): Promise<void> => {
  const polkadotUrl =
    'https://raw.githubusercontent.com/polkadot-js/apps/refs/heads/master/packages/apps-config/src/endpoints/productionRelayPolkadot.ts'

  const kusamaUrl =
    'https://raw.githubusercontent.com/polkadot-js/apps/refs/heads/master/packages/apps-config/src/endpoints/productionRelayKusama.ts'

  const nodeConfig: TModifiedNodeConfig[] = []

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

    const parseEndpointOption = (endpointOption: Node): TModifiedNodeConfig | null => {
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
        paraId === HYDRATION_PARA_ID
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
            nodeConfig.push(parsedOption)
          }
        })
      } else if (Node.isObjectLiteralExpression(initializer)) {
        const parsedOption = parseEndpointOption(initializer)
        if (parsedOption) {
          nodeConfig.push(parsedOption)
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
    }
  }

  await processEndpointsFromUrl(polkadotUrl, 'polkadot')

  await processEndpointsFromUrl(kusamaUrl, 'kusama')

  const nodes = NODE_NAMES_DOT_KSM.map(node => {
    return getNode(node)
  })

  const obj = {} as Record<TNodeDotKsmWithRelayChains, TModifiedNodeConfig>

  nodes.forEach(node => {
    const config = nodeConfig.find(c => c.info === node.info && c.relayChain === node.type)
    if (config) {
      obj[node.node] = {
        ...config,
        relayChain: undefined
      }
    }
  })

  obj['Polkadot'] = nodeConfig.find(c => c.info === 'polkadot') as TModifiedNodeConfig
  obj['Kusama'] = nodeConfig.find(c => c.info === 'kusama') as TModifiedNodeConfig

  obj['Polkadot'].relayChain = undefined
  obj['Kusama'].relayChain = undefined

  writeFileSync('./src/maps/configs.json', JSON.stringify(obj, null, 2))
}

void fetchRpcEndpoints()

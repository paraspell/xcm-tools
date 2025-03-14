/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { TForeignAsset, TNodeAssets } from '../src'
import axios from 'axios'
import { Project, SyntaxKind } from 'ts-morph'

export const fetchEthereumAssets = async (): Promise<TNodeAssets> => {
  const url =
    'https://raw.githubusercontent.com/Snowfork/snowbridge/refs/heads/main/web/packages/api/src/environment.ts'

  const response = await axios.get(url)
  const code = response.data as string

  const project = new Project()
  const sourceFile = project.createSourceFile('environment.ts', code)

  const snowbridgeEnv = sourceFile.getVariableDeclarationOrThrow('SNOWBRIDGE_ENV')

  const polkadotMainnet = snowbridgeEnv
    .getInitializerIfKindOrThrow(SyntaxKind.ObjectLiteralExpression)
    .getPropertyOrThrow('polkadot_mainnet')

  const mainnet = polkadotMainnet.getFirstDescendantByKindOrThrow(
    SyntaxKind.ObjectLiteralExpression
  )

  const locations = mainnet.getPropertyOrThrow('locations')

  const receivables = locations.getFirstChildByKindOrThrow(SyntaxKind.ArrayLiteralExpression)

  const ethObj = receivables.getFirstChildByKindOrThrow(SyntaxKind.ObjectLiteralExpression)

  const erc20tokensReceivable = ethObj.getPropertyOrThrow('erc20tokensReceivable')

  const tokenArray = erc20tokensReceivable.getFirstChildByKindOrThrow(
    SyntaxKind.ArrayLiteralExpression
  )

  const assets: TForeignAsset[] = [
    {
      symbol: 'ETH',
      assetId: '0x0000000000000000000000000000000000000000',
      existentialDeposit: '15000000000000',
      multiLocation: {
        parents: 1,
        interior: {
          X1: {
            GlobalConsensus: {
              Ethereum: {
                chainId: 1
              }
            }
          }
        }
      }
    }
  ]

  tokenArray.forEachChild(token => {
    const item = token.getFirstChildByKindOrThrow(SyntaxKind.SyntaxList)
    const symbol = item
      .getFirstChildByKindOrThrow(SyntaxKind.PropertyAssignment)
      .getFirstDescendantByKindOrThrow(SyntaxKind.StringLiteral)
      .getText()

    const assetId = item
      .getChildAtIndexIfKindOrThrow(2, SyntaxKind.PropertyAssignment)
      .getFirstChildByKindOrThrow(SyntaxKind.StringLiteral)
      .getText()

    const ed = item
      .getChildAtIndexIfKindOrThrow(4, SyntaxKind.PropertyAssignment)
      .getFirstChildByKindOrThrow(SyntaxKind.BigIntLiteral)
      .getText()

    const edTransformed = ed.replace(/_/g, '').replace('n', '')

    assets.push({
      symbol: JSON.parse(symbol),
      assetId: JSON.parse(assetId),
      existentialDeposit: edTransformed.toString(),
      multiLocation: {
        parents: 2,
        interior: {
          X2: [
            {
              GlobalConsensus: { Ethereum: { chainId: 1 } }
            },
            { AccountKey20: { network: null, key: JSON.parse(assetId) } }
          ]
        }
      }
    })
  })

  return {
    isEVM: true,
    supportsDryRunApi: false,
    relayChainAssetSymbol: 'DOT',
    nativeAssetSymbol: 'ETH',
    nativeAssets: [],
    otherAssets: assets
  }
}

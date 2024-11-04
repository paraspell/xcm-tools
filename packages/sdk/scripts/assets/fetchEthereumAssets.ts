import type { TAssetDetails, TNodeAssets } from '../../src/types'
import axios from 'axios'
import { Project, SyntaxKind } from 'ts-morph'

export const fetchEthereumAssets = async (): Promise<TNodeAssets> => {
  const url =
    'https://raw.githubusercontent.com/Snowfork/snowbridge/refs/heads/main/web/packages/api/src/environment.ts'

  const response = await axios.get(url)
  const code = response.data as string

  const project = new Project()
  const sourceFile = project.createSourceFile('environment.ts', code)

  const snowbridgeEnv = sourceFile.getVariableDeclaration('SNOWBRIDGE_ENV')
  if (!snowbridgeEnv) {
    console.log('SNOWBRIDGE_ENV not found')
    throw new Error('SNOWBRIDGE_ENV not found')
  }

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

  // remove property minimumTransferAmount from each token object
  tokenArray.forEachChild(token => {
    token.getLastChildByKindOrThrow(SyntaxKind.PropertyAssignment).remove()
  })

  const assets: TAssetDetails[] = []

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

    assets.push({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      symbol: JSON.parse(symbol),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      assetId: JSON.parse(assetId)
    })
  })

  return {
    relayChainAssetSymbol: 'DOT',
    nativeAssetSymbol: 'ETH',
    nativeAssets: [
      {
        symbol: 'ETH',
        decimals: 18
      }
    ],
    otherAssets: assets
  }
}

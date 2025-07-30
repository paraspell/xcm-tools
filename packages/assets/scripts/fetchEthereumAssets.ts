/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { TForeignAssetInfo, TChainAssetsInfo } from '../src'
import axios from 'axios'
import { Project, SyntaxKind } from 'ts-morph'

export const fetchEthereumAssets = async (): Promise<TChainAssetsInfo> => {
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

  const assets: TForeignAssetInfo[] = [
    {
      symbol: 'ETH',
      assetId: '0x0000000000000000000000000000000000000000',
      existentialDeposit: '15000000000000',
      location: {
        parents: 2,
        interior: {
          X1: [
            {
              GlobalConsensus: {
                Ethereum: {
                  chainId: 1
                }
              }
            }
          ]
        }
      }
    },
    {
      assetId: '0x56072c95faa701256059aa122697b133aded9279',
      symbol: 'SKY',
      location: {
        parents: 2,
        interior: {
          X2: [
            {
              GlobalConsensus: {
                Ethereum: {
                  chainId: 1
                }
              }
            },
            {
              AccountKey20: {
                network: null,
                key: '0x56072c95faa701256059aa122697b133aded9279'
              }
            }
          ]
        }
      },
      existentialDeposit: '1'
    },
    {
      assetId: '0x514910771af9ca656af840dff83e8264ecf986ca',
      symbol: 'LINK',
      location: {
        parents: 2,
        interior: {
          X2: [
            {
              GlobalConsensus: {
                Ethereum: {
                  chainId: 1
                }
              }
            },
            {
              AccountKey20: {
                network: null,
                key: '0x514910771af9ca656af840dff83e8264ecf986ca'
              }
            }
          ]
        }
      },
      existentialDeposit: '1'
    },
    {
      symbol: 'DOT',
      existentialDeposit: '1',
      location: {
        parents: 2,
        interior: {
          X1: [
            {
              GlobalConsensus: {
                Polkadot: null
              }
            }
          ]
        }
      }
    },
    {
      symbol: 'KSM',
      existentialDeposit: '1',
      location: {
        parents: 2,
        interior: {
          X1: [
            {
              GlobalConsensus: {
                Kusama: null
              }
            }
          ]
        }
      }
    },
    {
      symbol: 'MYTH',
      assetId: '0xba41ddf06b7ffd89d1267b5a93bfef2424eb2003',
      existentialDeposit: '1',
      location: {
        parents: 2,
        interior: {
          X2: [
            {
              GlobalConsensus: {
                Ethereum: {
                  chainId: 1
                }
              }
            },
            {
              AccountKey20: {
                network: null,
                key: '0xba41ddf06b7ffd89d1267b5a93bfef2424eb2003'
              }
            }
          ]
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
      location: {
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
    ss58Prefix: 42,
    supportsDryRunApi: false,
    supportsXcmPaymentApi: false,
    relaychainSymbol: 'DOT',
    nativeAssetSymbol: 'ETH',
    nativeAssets: [],
    otherAssets: assets
  }
}

import { getParaId } from '@paraspell/sdk-core'
import type { Environment } from '@snowbridge/base-types'

export const createEnvironment = (
  env: Environment,
  executionUrl: string | undefined
): Environment => ({
  ...env,
  assetOverrides: {
    '3369': [
      {
        token: '0xba41ddf06b7ffd89d1267b5a93bfef2424eb2003',
        name: 'Mythos',
        minimumBalance: 10_000_000_000_000_000n,
        symbol: 'MYTH',
        decimals: 18,
        isSufficient: true
      }
    ]
  },
  precompiles: { '2004': '0x000000000000000000000000000000000000081A' },
  ethereumChains: {
    ...env.ethereumChains,
    ...(executionUrl !== undefined ? { [env.ethChainId.toString()]: executionUrl } : {}),
    [getParaId('Moonbeam')]: 'https://rpc.api.moonbeam.network'
  }
})

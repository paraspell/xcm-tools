import { getParaId } from '@paraspell/sdk-core'
import { Context } from '@snowbridge/api'
import type { Environment } from '@snowbridge/base-types'
import type { AbstractProvider } from 'ethers'

export const createContext = (executionUrl: string | AbstractProvider, env: Environment) => {
  const isStringProvider = typeof executionUrl === 'string'
  const context = new Context({
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
      ...(isStringProvider ? { [env.ethChainId.toString()]: executionUrl } : {}),
      [getParaId('Moonbeam')]: 'https://rpc.api.moonbeam.network'
    }
  })
  if (!isStringProvider) context.setEthProvider(env.ethChainId, executionUrl)
  return context
}

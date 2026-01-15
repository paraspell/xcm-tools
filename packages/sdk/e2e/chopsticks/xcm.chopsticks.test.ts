
import { afterAll } from 'vitest'
import {
  getChainProviders,
  TSubstrateChain,
  TBuilderConfig,
  TApiOrUrl,
  TUrl
} from '@paraspell/sdk-core'

import { Builder, SUBSTRATE_CHAINS } from '../../src'
import { createChainClient, createSr25519Signer } from '../../src/utils'

import { BuildBlockMode, setupWithServer, destroyWorker } from '@acala-network/chopsticks'
import { generateE2eTests } from '../../../sdk-core/e2e'
import { getEcdsaSigner, validateTransfer, validateTx } from '../utils'

type ChopsticksServer = {
  addr: string
  close: () => Promise<void>
}

type ChopsticksInstance = {
  server: ChopsticksServer
}

const chopsticksInstances: ChopsticksInstance[] = []
const chainsWithInvalidRpc = ["LaosPaseo", "ZeitgeistPaseo", "KiltPaseo"]
const filteredChains = SUBSTRATE_CHAINS.filter(chain => !chainsWithInvalidRpc.includes(chain))

const formatChopsticksAddress = (addr: string) => {
  return `ws://${addr}`
}

export const createChopsticksWorker = async (chain: TSubstrateChain) => {
  const server = await setupWithServer({
    endpoint: getChainProviders(chain),
    port: 0,
    'build-block-mode': BuildBlockMode.Instant,
  })
  chopsticksInstances.push({ server })
  return formatChopsticksAddress(server.addr)
}

export const createChopsticksBuildOptions = async (): Promise<TBuilderConfig<TApiOrUrl<TUrl>>> => {
  const chainMap: Record<TSubstrateChain, string> = Object.fromEntries(
    await Promise.all(
      filteredChains.map(async (chain) => {
        try {
          const address = await createChopsticksWorker(chain)
          return [chain, address]
        } catch (error) {
          console.error(`Failed to create chopsticks worker for ${chain}:`, error)
          return [chain, null]
        }
      })
    )
  )

  return {
    development: true,
    apiOverrides: Object.fromEntries(
      Object.entries(chainMap).map(([chain, url]) => [chain, [url]])
    )
  }
}


afterAll(async () => {
  for (const instance of chopsticksInstances) {
    await instance.server.close()
  }
  await destroyWorker()
})

const signer = createSr25519Signer('//Alice')
const evmSigner = getEcdsaSigner()

const chopsticksBuildOptions = await createChopsticksBuildOptions()

generateE2eTests(
  Builder,
  createChainClient,
  signer,
  evmSigner,
  validateTx,
  validateTransfer,
  [...filteredChains],
  false,
  chopsticksBuildOptions,
)


import { afterAll } from 'vitest'
import {
  getChainProviders,
  TSubstrateChain
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
  chain: TSubstrateChain
  server: ChopsticksServer
}

const chopsticksInstances: ChopsticksInstance[] = []

const formatChopsticksAddress = (addr: string) => {
  return `ws://${addr}`
}

export const createChopsticksWorker = async (chain: TSubstrateChain) => {
  const server = await setupWithServer({
    endpoint: getChainProviders(chain),
    port: 0,
    'build-block-mode': BuildBlockMode.Instant,
  })
  chopsticksInstances.push({ chain, server })
  return formatChopsticksAddress(server.addr)
}

export const createRequiredChopsticksChains = async (chains: TSubstrateChain[]) => {
  return Object.fromEntries(
    await Promise.all(
      chains.map(async (chain) => {
        const instance = chopsticksInstances.find(instance => instance.chain === chain)
        if (instance) {
          return [chain, formatChopsticksAddress(instance.server.addr)]
        }
        const address = await createChopsticksWorker(chain)
        return [chain, address]
      })
    )
  ) as Record<TSubstrateChain, string>
}


afterAll(async () => {
  for (const instance of chopsticksInstances) {
    await instance.server.close()
  }
  await destroyWorker()
})

const signer = createSr25519Signer('//Alice')
const evmSigner = getEcdsaSigner()

generateE2eTests(
  Builder,
  createChainClient,
  signer,
  evmSigner,
  validateTx,
  validateTransfer,
  [...SUBSTRATE_CHAINS],
  false,
  createRequiredChopsticksChains,
  true
)

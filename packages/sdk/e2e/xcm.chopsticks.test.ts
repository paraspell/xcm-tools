import { afterAll } from 'vitest'
import { BuildBlockMode, destroyWorker, setupWithServer } from '@acala-network/chopsticks'
import { getChainProviders, TBuilderConfig, TSubstrateChain, TUrl } from '@paraspell/sdk-core'
import { setTimeout } from 'timers/promises'

import { Builder, SUBSTRATE_CHAINS } from '../src'
import { createSigners, validateTransfer, validateTx } from './utils'
import { generateE2eTests } from '../../sdk-core/e2e'

const CHOPSTICKS_TIMEOUT_MS = 30000

// Port 0 uses a random available port
const CHOPSTICKS_PORT = 0

//Timeout for RPCs
const CHOPSTICKS_RPC_TIMEOUT_MS = 600000000


const chopsticksInstances: Awaited<ReturnType<typeof setupWithServer>>[] = []

export const createChopsticksInstance = async (chain: TSubstrateChain) => {
  return setupWithServer({
    endpoint: getChainProviders(chain),
    port: CHOPSTICKS_PORT,
    "rpc-timeout": CHOPSTICKS_RPC_TIMEOUT_MS,
    'build-block-mode': BuildBlockMode.Instant
  })
}

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T | null> =>
  Promise.race([promise, setTimeout(ms, null)])

export const createBuilderConfig = async (): Promise<TBuilderConfig<TUrl>> => {
  const apiOverrides: TBuilderConfig<TUrl>['apiOverrides'] = {}

  await Promise.all(
    SUBSTRATE_CHAINS.map(async chain => {
      const instance = await withTimeout(createChopsticksInstance(chain), CHOPSTICKS_TIMEOUT_MS)
      if (!instance) return
      chopsticksInstances.push(instance)
      apiOverrides[chain] = `ws://${instance.addr}`
    })
  )

  return {
    development: true,
    apiOverrides
  }
}

afterAll(async () => {
  await Promise.all(chopsticksInstances.map(s => s.close()))
  await destroyWorker()
})

const config = await createBuilderConfig()

generateE2eTests(
  Builder,
  createSigners(),
  validateTx,
  validateTransfer,
  [...SUBSTRATE_CHAINS],
  config
)

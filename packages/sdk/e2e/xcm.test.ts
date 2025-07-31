import { Builder } from '../src'
import { createChainClient } from '../src/utils'
import { createEcdsaSigner, createSr25519Signer, filteredChains, validateTx } from './utils'
import { generateE2eTests } from '../../sdk-core/e2e'

const signer = createSr25519Signer()
const evmSigner = createEcdsaSigner()

generateE2eTests(Builder, createChainClient, signer, evmSigner, validateTx, filteredChains, false)

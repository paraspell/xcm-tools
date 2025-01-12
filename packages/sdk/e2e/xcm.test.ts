import { Builder, createApiInstanceForNode } from '../src'
import { createEcdsaSigner, createSr25519Signer, filteredNodes, validateTx } from './utils'
import { generateE2eTests } from '../../sdk-core/e2e/utils'

const signer = createSr25519Signer()
const evmSigner = createEcdsaSigner()

generateE2eTests(Builder, createApiInstanceForNode, signer, evmSigner, validateTx, filteredNodes)

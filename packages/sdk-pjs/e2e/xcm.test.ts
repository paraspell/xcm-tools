import { Builder, createApiInstanceForNode } from '../src'
import { generateE2eTests } from '../../sdk-core/e2e/utils'
import { filteredNodes, validateTx } from './utils'

// PolkadotJs can validate transactions without a signer
// Provide a dummy signer to satisfy the function signature
const signer = {}

generateE2eTests(Builder, createApiInstanceForNode, signer, signer, validateTx, filteredNodes)

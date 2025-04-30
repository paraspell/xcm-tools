import { Builder, createApiInstanceForNode, NODE_NAMES_DOT_KSM, TNodePolkadotKusama } from '../src'
import { generateE2eTests } from '../../sdk-core/e2e'
import { filteredNodes, validateTx } from './utils'

// PolkadotJs can validate transactions without a signer
// Provide a dummy signer to satisfy the function signature
const signer = {}

generateE2eTests(Builder, createApiInstanceForNode, signer, signer, validateTx, [
  ...NODE_NAMES_DOT_KSM
])

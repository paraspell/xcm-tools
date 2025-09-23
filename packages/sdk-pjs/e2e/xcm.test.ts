import { Builder, createChainClient, SUBSTRATE_CHAINS } from '../src'
import { generateE2eTests } from '../../sdk-core/e2e'
import { validateTx } from './utils'

// PolkadotJs can validate transactions without a signer
// Provide a dummy signer to satisfy the function signature
const signer = {}

generateE2eTests(
  Builder,
  createChainClient,
  signer,
  signer,
  validateTx,
  () => Promise.resolve(),
  [...SUBSTRATE_CHAINS],
  true
)

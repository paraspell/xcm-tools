import { Builder, createChainClient, CHAIN_NAMES_DOT_KSM } from '../src'
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
  [...CHAIN_NAMES_DOT_KSM],
  true
)

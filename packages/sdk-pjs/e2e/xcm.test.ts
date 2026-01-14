import { Builder, SUBSTRATE_CHAINS } from '../src'
import { generateE2eTests } from '../../sdk-core/e2e'
import { validateTx } from './utils'

generateE2eTests(
  Builder,
  // PolkadotJs can validate transactions without a signer
  // Provide a dummy signers to satisfy the function signature
  [{}, {}],
  validateTx,
  () => Promise.resolve(),
  [...SUBSTRATE_CHAINS]
)

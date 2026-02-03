import { Builder, SUBSTRATE_CHAINS, TPjsSigner } from '../src'
import { generateE2eTests } from '../../sdk-core/e2e'
import { validateTx } from './utils'

const dummySigner = {
  signer: {},
  address: ''
}

generateE2eTests(
  Builder,
  // PolkadotJs can validate transactions without a signer
  // Provide a dummy signers to satisfy the function signature
  [dummySigner, dummySigner],
  validateTx,
  () => Promise.resolve(),
  [...SUBSTRATE_CHAINS]
)

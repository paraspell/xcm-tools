import { Builder, SUBSTRATE_CHAINS } from '../src'
import { createChainClient, createSr25519Signer } from '../src/utils'
import { getEcdsaSigner, validateTransfer, validateTx } from './utils'
import { generateE2eTests } from '../../sdk-core/e2e'

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
  false
)

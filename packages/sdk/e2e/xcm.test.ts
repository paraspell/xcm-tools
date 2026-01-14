import { Builder, SUBSTRATE_CHAINS } from '../src'
import { createSigners, validateTransfer, validateTx } from './utils'
import { generateE2eTests } from '../../sdk-core/e2e'

generateE2eTests(Builder, createSigners(), validateTx, validateTransfer, [...SUBSTRATE_CHAINS])

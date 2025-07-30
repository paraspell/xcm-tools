import { expect } from 'vitest'
import { Extrinsic, SUBSTRATE_CHAINS } from '../src'

export const validateTx = async (tx: Extrinsic) => {
  expect(tx).toBeDefined()
}

export const filteredChains = SUBSTRATE_CHAINS

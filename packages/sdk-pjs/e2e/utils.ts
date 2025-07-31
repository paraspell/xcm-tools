import { expect } from 'vitest'
import { Extrinsic, CHAIN_NAMES_DOT_KSM } from '../src'

export const validateTx = async (tx: Extrinsic) => {
  expect(tx).toBeDefined()
}

export const filteredChains = CHAIN_NAMES_DOT_KSM

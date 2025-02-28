import { expect } from 'vitest'
import { Extrinsic, NODE_NAMES_DOT_KSM } from '../src'

export const validateTx = async (tx: Extrinsic) => {
  expect(tx).toBeDefined()
}

export const filteredNodes = NODE_NAMES_DOT_KSM.filter(
  node =>
    // WS endpoint not working
    node !== 'InvArchTinker' && node !== 'Darwinia'
)

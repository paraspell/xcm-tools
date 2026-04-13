import { expect } from 'vitest'
import { Extrinsic } from '../src'

export const validateTx = async (tx: Extrinsic) => {
  expect(tx).toBeDefined()
}

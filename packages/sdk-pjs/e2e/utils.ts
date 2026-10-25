import { Extrinsic } from '../src'
import { createTxValidator } from '../../sdk-core/e2e'

const serializeTx = ({ method }: Extrinsic) => ({
  module: method.section,
  method: method.method,
  params: method.toPrimitive()
})

export const validateTx = createTxValidator(serializeTx)

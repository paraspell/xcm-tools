import { InvalidCurrencyError } from '../../errors'
import {
  type IXTransferTransfer,
  Version,
  type XTransferTransferInput,
  type Extrinsic,
  type TSerializedApiCall
} from '../../types'
import ParachainNode from '../ParachainNode'
import XTransferTransferImpl from '../XTransferTransferImpl'

class Phala extends ParachainNode implements IXTransferTransfer {
  constructor() {
    super('Phala', 'phala', 'polkadot', Version.V3)
  }

  transferXTransfer(input: XTransferTransferInput): Extrinsic | TSerializedApiCall {
    const { currency } = input
    if (currency !== 'PHA') {
      throw new InvalidCurrencyError(`Node ${this.node} does not support currency ${currency}`)
    }
    return XTransferTransferImpl.transferXTransfer(input)
  }
}

export default Phala

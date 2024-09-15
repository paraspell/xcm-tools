import { BN } from '@polkadot/util'
import { Extrinsic } from '../../types'

export const calculateTransactionFee = async (tx: Extrinsic, address: string): Promise<BN> => {
  const { partialFee } = await tx.paymentInfo(address)
  return partialFee.toBn()
}

import type { BN } from '@polkadot/util'
import type { Extrinsic } from '../../types'

export const calculateTransactionFee = async (tx: Extrinsic, address: string): Promise<BN> => {
  const { partialFee } = await tx.paymentInfo(address)
  return partialFee.toBn()
}

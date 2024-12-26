import { environment, toPolkadot } from '@snowbridge/api'
import { checkPlanFailure } from './checkPlanFailure'
import { findEthAsset } from './findEthAsset'
import { createContext } from './createContext'
import {
  getParaId,
  type TSerializedEthTransfer,
  type TSerializeEthTransferOptions
} from '@paraspell/sdk-core'

export const buildEthTransferOptions = async ({
  currency,
  to,
  address,
  destAddress
}: TSerializeEthTransferOptions): Promise<TSerializedEthTransfer> => {
  const ethAsset = findEthAsset(currency)

  const env = environment.SNOWBRIDGE_ENV['polkadot_mainnet']

  const EXECUTION_URL = 'https://eth.llamarpc.com'

  const context = await createContext(EXECUTION_URL, env.config)

  const destParaId = getParaId(to)

  const signer = {
    getAddress: () => Promise.resolve(address)
  }

  const plan = await toPolkadot.validateSend(
    context,
    signer,
    destAddress,
    ethAsset.assetId ?? '',
    destParaId,
    BigInt(currency.amount),
    BigInt(0)
  )

  checkPlanFailure(plan)

  if (!plan.success) {
    throw new Error('Failed to validate send')
  }

  return {
    token: plan.success.token,
    destinationParaId: plan.success.destinationParaId,
    destinationFee: plan.success.destinationFee,
    amount: plan.success.amount,
    fee: plan.success.fee
  }
}

import { environment, toPolkadot } from '@snowbridge/api'
import { checkPlanFailure } from './checkPlanFailure'
import { createContext } from './createContext'
import {
  getAssetBySymbolOrId,
  getParaId,
  InvalidCurrencyError,
  isForeignAsset,
  isOverrideMultiLocationSpecifier,
  type TSerializedEthTransfer,
  type TSerializeEthTransferOptions
} from '@paraspell/sdk-core'

export const buildEthTransferOptions = async ({
  currency,
  to,
  address,
  destAddress
}: TSerializeEthTransferOptions): Promise<TSerializedEthTransfer> => {
  if ('multiasset' in currency) {
    throw new Error('Multiassets syntax is not supported for Evm transfers')
  }

  if ('multilocation' in currency && isOverrideMultiLocationSpecifier(currency.multilocation)) {
    throw new Error('Override multilocation is not supported for Evm transfers')
  }

  const ethAsset = getAssetBySymbolOrId('Ethereum', currency, to)

  if (ethAsset === null) {
    throw new InvalidCurrencyError(
      `Origin node Ethereum does not support currency ${JSON.stringify(currency)}.`
    )
  }

  const env = environment.SNOWBRIDGE_ENV['polkadot_mainnet']

  const EXECUTION_URL = 'https://eth.llamarpc.com'

  const context = await createContext(EXECUTION_URL, env.config)

  const destParaId = getParaId(to)

  const signer = {
    getAddress: () => Promise.resolve(address)
  }

  if (!isForeignAsset(ethAsset) || ethAsset.assetId === undefined) {
    throw new InvalidCurrencyError('Selected asset has no asset id')
  }

  const plan = await toPolkadot.validateSend(
    context,
    signer,
    destAddress,
    ethAsset.assetId,
    destParaId,
    BigInt(currency.amount),
    0n
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

import { toPolkadot, environment } from '@snowbridge/api'
import { findEthAsset } from './findEthAsset'
import { createContext } from './createContext'
import { checkPlanFailure } from './checkPlanFailure'
import { isEthersSigner } from './utils'
import { getParaId, type TEvmBuilderOptions } from '@paraspell/sdk-core'

/**
 * Transfers an Ethereum asset to a Polkadot account.
 *
 * @param provider - The Ethereum provider instance to interact with the Ethereum network.
 * @param options - The options for the transfer.
 *
 * @returns A Promise that resolves to an object containing the result and the plan of the transfer.
 *
 * @throws Will throw an error if the transfer validation fails or if the transfer cannot be completed.
 */
export const transferEthToPolkadot = async <TApi, TRes>({
  provider,
  signer,
  address,
  to,
  currency
}: TEvmBuilderOptions<TApi, TRes>) => {
  if (!provider) {
    throw new Error('provider parameter is required for Snowbridge transfers.')
  }

  if (!isEthersSigner(signer)) {
    throw new Error('Snowbridge does not support Viem provider yet.')
  }

  const ethAsset = findEthAsset(currency)

  const env = environment.SNOWBRIDGE_ENV['polkadot_mainnet']
  const context = await createContext(provider, env.config)

  const destParaId = getParaId(to)

  const plan = await toPolkadot.validateSend(
    context,
    signer,
    address,
    ethAsset.assetId ?? '',
    destParaId,
    BigInt(currency.amount),
    BigInt(0)
  )

  checkPlanFailure(plan)

  const result = await toPolkadot.send(context, signer, plan)

  return {
    result,
    plan
  }
}

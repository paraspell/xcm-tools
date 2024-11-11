import { toPolkadot, environment } from '@snowbridge/api'
import type { TEvmBuilderOptions } from '../../../types/TBuilder'
import type { AbstractProvider } from 'ethers'
import { getParaId } from '../../assets'
import { findEthAsset } from './findEthAsset'
import { createContext } from './createContext'
import { checkPlanFailure } from './checkPlanFailure'

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
const transferEthToPolkadot = async (
  provider: AbstractProvider,
  { signer, address, to, amount, currency }: TEvmBuilderOptions
) => {
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
    BigInt(amount),
    BigInt(0)
  )

  checkPlanFailure(plan)

  const result = await toPolkadot.send(context, signer, plan)

  return {
    result,
    plan
  }
}

export default transferEthToPolkadot

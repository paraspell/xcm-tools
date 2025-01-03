import { toPolkadot, environment } from '@snowbridge/api'
import { createContext } from './createContext'
import { checkPlanFailure } from './checkPlanFailure'
import { isEthersSigner } from './utils'
import {
  getAssetBySymbolOrId,
  getParaId,
  InvalidCurrencyError,
  isForeignAsset,
  isOverrideMultiLocationSpecifier,
  type TEvmBuilderOptions
} from '@paraspell/sdk-core'

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
  if ('multiasset' in currency) {
    throw new Error('Multiassets syntax is not supported for Evm transfers')
  }

  if ('multilocation' in currency && isOverrideMultiLocationSpecifier(currency.multilocation)) {
    throw new Error('Override multilocation is not supported for Evm transfers')
  }

  if (!provider) {
    throw new Error('provider parameter is required for Snowbridge transfers.')
  }

  if (!isEthersSigner(signer)) {
    throw new Error('Snowbridge does not support Viem provider yet.')
  }

  const ethAsset = getAssetBySymbolOrId('Ethereum', currency, to)

  if (ethAsset === null) {
    throw new InvalidCurrencyError(
      `Origin node Ethereum does not support currency ${JSON.stringify(currency)}.`
    )
  }

  const env = environment.SNOWBRIDGE_ENV['polkadot_mainnet']
  const context = await createContext(provider, env.config)

  const destParaId = getParaId(to)

  if (!isForeignAsset(ethAsset) || ethAsset.assetId === undefined) {
    throw new InvalidCurrencyError('Selected asset has no asset id')
  }

  const plan = await toPolkadot.validateSend(
    context,
    signer,
    address,
    ethAsset.assetId,
    destParaId,
    BigInt(currency.amount),
    0n
  )

  checkPlanFailure(plan)

  const result = await toPolkadot.send(context, signer, plan)

  return {
    result,
    plan
  }
}

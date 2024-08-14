import { toPolkadot, environment } from '@snowbridge/api'
import { TEvmBuilderOptions } from '../../../types/TBuilder'
import { AbstractProvider } from 'ethers'
import { getParaId } from '../../assets'
import { findEthAsset } from './findEthAsset'
import { createContext } from './createContext'
import { checkPlanFailure } from './checkPlanFailure'

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
    ethAsset.assetId,
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

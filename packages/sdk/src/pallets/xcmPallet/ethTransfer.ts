import { toPolkadot, environment, contextFactory } from '@snowbridge/api'
import { TEvmBuilderOptions } from '../../types/TBuilder'
import { AbstractProvider } from 'ethers'
import { getOtherAssets, getParaId } from '../assets'
import { InvalidCurrencyError } from '../../errors'

const transferEthToPolkadot = async (
  provider: AbstractProvider,
  { signer, address, to, amount, currency }: TEvmBuilderOptions
) => {
  const ethAssets = getOtherAssets('Ethereum')
  const ethAsset = ethAssets.find(asset => asset.symbol === currency)
  if (!ethAsset) {
    throw new InvalidCurrencyError(`Currency ${currency} is not supported for Ethereum transfers`)
  }

  const env = environment.SNOWBRIDGE_ENV['polkadot_mainnet']
  const { config } = env
  const context = await contextFactory({
    ethereum: {
      execution_url: provider,
      beacon_url: config.BEACON_HTTP_API
    },
    polkadot: {
      url: {
        bridgeHub: config.BRIDGE_HUB_URL,
        assetHub: config.ASSET_HUB_URL,
        relaychain: config.RELAY_CHAIN_URL,
        parachains: config.PARACHAINS
      }
    },
    appContracts: {
      gateway: config.GATEWAY_CONTRACT,
      beefy: config.BEEFY_CONTRACT
    }
  })
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

  if (plan.failure) {
    throw new Error(
      `Failed to validate send: ${plan.failure.errors.map(e => e.message).join('\n\n')}`
    )
  }

  const result = await toPolkadot.send(context, signer, plan)

  return {
    result,
    plan
  }
}

export default transferEthToPolkadot

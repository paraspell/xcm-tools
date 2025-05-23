import { InvalidParameterError } from '@paraspell/sdk-core'
import { environment } from '@snowbridge/api'
import { WETH9__factory } from '@snowbridge/contract-types'
import type { Signer } from 'ethers'

export const approveToken = async (signer: Signer, amount: bigint, symbol: string) => {
  const env = environment.SNOWBRIDGE_ENV['polkadot_mainnet']

  const contract = env.locations[0].erc20tokensReceivable.find(t => t.id === symbol)

  if (!contract) {
    throw new InvalidParameterError(`Token ${symbol} not supported`)
  }

  const weth9 = WETH9__factory.connect(contract.address, signer)
  const result = await weth9.approve(env.config.GATEWAY_CONTRACT, amount)
  const receipt = await result.wait()

  return { result, receipt }
}

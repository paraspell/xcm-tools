import { environment } from '@snowbridge/api'
import { WETH9__factory } from '@snowbridge/contract-types'
import type { Signer } from 'ethers'

export const getTokenBalance = async (signer: Signer, symbol: string) => {
  const env = environment.SNOWBRIDGE_ENV['polkadot_mainnet']
  const contract = env.locations[0].erc20tokensReceivable.find(t => t.id === symbol)

  if (!contract) {
    throw new Error(`Token ${symbol} not supported`)
  }

  const weth9 = WETH9__factory.connect(contract.address, signer)
  const address = await signer.getAddress()
  return weth9.balanceOf(address)
}

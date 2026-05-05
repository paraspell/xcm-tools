import type { TChain } from '@paraspell/sdk-core'
import { UnsupportedOperationError } from '@paraspell/sdk-core'
import type { Chain } from 'viem'
import { darwinia, moonbeam, moonriver } from 'viem/chains'

const EVM_VIEM_CHAIN_BY_ORIGIN: Partial<Record<TChain, Chain>> = {
  Moonbeam: moonbeam,
  Moonriver: moonriver,
  Darwinia: darwinia
}

export const getViemChain = (chain: TChain): Chain => {
  const viemChain = EVM_VIEM_CHAIN_BY_ORIGIN[chain]
  if (!viemChain) {
    throw new UnsupportedOperationError(`No viem chain registered for '${chain}'.`)
  }
  return viemChain
}

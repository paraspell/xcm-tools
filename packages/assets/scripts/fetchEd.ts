import type { ApiPromise } from '@polkadot/api'

export const fetchExistentialDeposit = (api: ApiPromise): string | null => {
  const balances = api.consts.balances
  return balances !== undefined ? balances.existentialDeposit.toString() : null
}

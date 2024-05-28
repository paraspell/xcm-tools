import { ApiPromise } from '@polkadot/api'
import { NODES_WITH_RELAY_CHAINS } from '../../src/maps/consts'
import { TEdJsonMap } from '../../src/types'
import { createApiInstanceForNode } from '../../src/utils'
import { fetchTryMultipleProvidersWithTimeout } from '../scriptUtils'

const fetchExistentialDeposit = async (api: ApiPromise): Promise<string | null> => {
  const balances = api.consts.balances
  return balances !== undefined ? balances.existentialDeposit.toString() : null
}

export const fetchAllExistentialDeposits = async (assetsMapJson: any) => {
  const output: TEdJsonMap = JSON.parse(JSON.stringify(assetsMapJson))
  for (const node of NODES_WITH_RELAY_CHAINS) {
    console.log(`Fetching existential deposits for ${node}...`)

    let newData: string | null
    if (node === 'Polkadot' || node === 'Kusama') {
      const api = await createApiInstanceForNode(node)
      newData = await fetchExistentialDeposit(api)
    } else {
      newData = await fetchTryMultipleProvidersWithTimeout(node, api =>
        fetchExistentialDeposit(api)
      )
    }

    const oldData = Object.prototype.hasOwnProperty.call(output, node) ? output[node] : null

    output[node] = newData ?? oldData
  }
  return output
}

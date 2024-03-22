import { ApiPromise } from '@polkadot/api'
import { NODES_WITH_RELAY_CHAINS } from '../src/maps/consts'
import { TEdJsonMap } from '../src/types'
import {
  checkForNodeJsEnvironment,
  readJsonOrReturnEmptyObject,
  writeJsonSync
} from './scriptUtils'
import { createApiInstanceForNode } from '../src/utils'

const fetchExistentialDeposit = async (api: ApiPromise): Promise<string | null> => {
  const balances = api.consts.balances
  return balances !== undefined ? balances.existentialDeposit.toString() : null
}

const fetchAllExistentialDeposits = async (assetsMapJson: any) => {
  const output: TEdJsonMap = JSON.parse(JSON.stringify(assetsMapJson))
  for (const node of NODES_WITH_RELAY_CHAINS) {
    console.log(`Fetching existential deposits for ${node}...`)

    const api = await createApiInstanceForNode(node)
    const newData = await fetchExistentialDeposit(api)

    const oldData = Object.prototype.hasOwnProperty.call(output, node) ? output[node] : null

    output[node] = newData ?? oldData
  }
  return output
}

;(async () => {
  checkForNodeJsEnvironment()
  const JSON_FILE_PATH = './src/maps/existential-deposits.json'
  const assetsJson = await readJsonOrReturnEmptyObject(JSON_FILE_PATH)
  const data = await fetchAllExistentialDeposits(assetsJson)
  writeJsonSync(JSON_FILE_PATH, data)
  console.log('Successfuly updated existential deposits.')
  process.exit()
})()

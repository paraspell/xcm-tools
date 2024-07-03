import { checkForNodeJsEnvironment, handleDataFetching } from '../scriptUtils'
import { fetchAllExistentialDeposits } from './fetchEds'

const JSON_FILE_PATH = './src/maps/existential-deposits.json'

void (async () => {
  checkForNodeJsEnvironment()
  await handleDataFetching(
    JSON_FILE_PATH,
    fetchAllExistentialDeposits,
    'Successfuly updated existential deposits.'
  )
})()

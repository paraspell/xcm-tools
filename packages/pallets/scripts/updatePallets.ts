// Script that updates XCM Pallets map for compatible nodes

import { checkForNodeJsEnvironment, handleDataFetching } from '../../sdk-common/scripts/scriptUtils'
import { fetchAllNodesPallets } from './fetchPallets'

const JSON_FILE_PATH = './src/maps/pallets.json'

void (async () => {
  checkForNodeJsEnvironment()
  await handleDataFetching(JSON_FILE_PATH, fetchAllNodesPallets, 'Successfuly updated pallets.')
})()

// Script that updates XCM Pallets map for compatible chains

import { checkForNodeJsEnvironment, handleDataFetching } from '../../sdk-common/scripts/scriptUtils'
import { fetchAllChainsPallets } from './fetchPallets'

const JSON_FILE_PATH = './src/maps/pallets.json'

void (async () => {
  checkForNodeJsEnvironment()
  await handleDataFetching(JSON_FILE_PATH, fetchAllChainsPallets, 'Successfuly updated pallets.')
})()

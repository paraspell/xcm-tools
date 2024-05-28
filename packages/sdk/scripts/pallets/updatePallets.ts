// Script that updates XCM Pallets map for compatible nodes

import { checkForNodeJsEnvironment, handleDataFetching } from '../scriptUtils'
import { fetchAllNodesPallets } from './fetchPallets'

const JSON_FILE_PATH = './src/maps/pallets.json'

;(async () => {
  checkForNodeJsEnvironment()
  await handleDataFetching(JSON_FILE_PATH, fetchAllNodesPallets, 'Successfuly updated pallets.')
})()

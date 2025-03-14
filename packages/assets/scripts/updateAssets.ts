// Script that updates asset map for compatible nodes

import { handleDataFetching } from '../../sdk-common/scripts/scriptUtils'
import { fetchAllNodesAssets } from './fetchAssets'

const JSON_FILE_PATH = './src/maps/assets.json'

void (async () => {
  await handleDataFetching(JSON_FILE_PATH, fetchAllNodesAssets, 'Successfuly updated assets map.')
})()

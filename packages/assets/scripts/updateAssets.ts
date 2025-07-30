// Script that updates asset map for compatible chains

import { handleDataFetching } from '../../sdk-common/scripts/scriptUtils'
import { fetchAllChainsAssets } from './fetchAssets'

const JSON_FILE_PATH = './src/maps/assets.json'

void (async () => {
  await handleDataFetching(JSON_FILE_PATH, fetchAllChainsAssets, 'Successfuly updated assets map.')
})()

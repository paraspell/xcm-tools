import { createXcmIdentityCall as createXcmIdentityCallImpl } from '@paraspell/sdk-core'

import type { Extrinsic, TPjsApi } from './types'
import { createPolkadotJsApiCall } from './utils'

export const createXcmIdentityCall = createPolkadotJsApiCall(
  createXcmIdentityCallImpl<TPjsApi, Extrinsic>
)

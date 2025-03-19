import { createXcmIdentityCall as createXcmIdentityCallImpl } from '@paraspell/sdk-core'

import type { TPapiApi, TPapiTransaction } from './types'
import { createPapiApiCall } from './utils'

export const createXcmIdentityCall = createPapiApiCall(
  createXcmIdentityCallImpl<TPapiApi, TPapiTransaction>
)

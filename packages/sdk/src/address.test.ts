import * as sdkCore from '@paraspell/sdk-core'
import { describe, expect, it, vi } from 'vitest'

import { convertSs58 } from './address'
import PapiApi from './PapiApi'

vi.mock('@paraspell/sdk-core')

vi.mock('./PapiApi')

describe('Address functions', () => {
  it('should initialize PapiApi and call setApi with the provided api', () => {
    convertSs58('address', 'Acala')
    expect(sdkCore.convertSs58).toHaveBeenCalledWith(expect.any(PapiApi), 'address', 'Acala')
  })
})

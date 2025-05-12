import * as sdkCore from '@paraspell/sdk-core'
import { describe, expect, it, vi } from 'vitest'

import { convertSs58 } from './address'
import PolkadotJsApi from './PolkadotJsApi'

vi.mock('./PolkadotJsApi')
vi.mock('@paraspell/sdk-core')

describe('Address functions', () => {
  it('should initialize PolkadotJsApi and call setApi with the provided api', () => {
    convertSs58('address', 'Acala')
    expect(sdkCore.convertSs58).toHaveBeenCalledWith(expect.any(PolkadotJsApi), 'address', 'Acala')
  })
})

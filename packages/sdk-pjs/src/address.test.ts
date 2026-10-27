import * as sdkCore from '@paraspell/sdk-core'
import { describe, expect, it, vi } from 'vitest'

import { convertSs58 } from './address'
import PolkadotJsApi from './PolkadotJsApi'

vi.mock('./PolkadotJsApi')
vi.mock('@paraspell/sdk-core', { spy: true })

describe('Address functions', () => {
  it('should initialize PolkadotJsApi and call setApi with the provided api', () => {
    vi.mocked(sdkCore.convertSs58).mockReturnValue('converted')

    expect(convertSs58('address', 'Acala')).toBe('converted')
    expect(sdkCore.convertSs58).toHaveBeenCalledWith(expect.any(PolkadotJsApi), 'address', 'Acala')
  })
})

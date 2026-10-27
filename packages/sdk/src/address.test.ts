import * as sdkCore from '@paraspell/sdk-core'
import { describe, expect, it, vi } from 'vitest'

import { convertSs58 } from './address'
import PapiApi from './PapiApi'

vi.mock('@paraspell/sdk-core', { spy: true })

vi.mock('./PapiApi')

describe('Address functions', () => {
  it('should initialize PapiApi and call setApi with the provided api', () => {
    vi.mocked(sdkCore.convertSs58).mockReturnValue('converted')

    expect(convertSs58('address', 'Acala')).toBe('converted')
    expect(sdkCore.convertSs58).toHaveBeenCalledWith(expect.any(PapiApi), 'address', 'Acala')
  })
})

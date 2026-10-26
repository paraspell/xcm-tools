// Regression test for C-2: validateTransact must THROW on sender/recipient
// mismatch (it used to RETURN the ValidationError, which the sole call site
// discarded, leaving the guard dead).
import { isChainEvm } from '@paraspell/assets'
import { isHex } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
import { ValidationError } from '../../errors'
import type { TSubstrateTransferOptions } from '../../types'
import { compareAddresses } from '../../utils'
import { validateTransact } from './validationUtils'

vi.mock('viem')
vi.mock('@paraspell/pallets')
vi.mock('@paraspell/sdk-common', async (importActual) => ({
  ...(await importActual()),
  isBridge: vi.fn(),
  isExternalChain: vi.fn(),
  isRelayChain: vi.fn(),
  isSubstrateBridge: vi.fn(),
  isTLocation: vi.fn(),
}))
vi.mock('@paraspell/assets', () => ({
  getNativeAssets: vi.fn(),
  InvalidCurrencyError: class extends Error {},
  isAssetEqual: vi.fn(),
  isSymbolSpecifier: vi.fn(),
  isChainEvm: vi.fn(),
}))
vi.mock('../../utils')

describe('C-2 regression: validateTransact must throw on sender/recipient mismatch', () => {
  const baseOptions = {
    api: {} as unknown as PolkadotApi<unknown, unknown, unknown>,
    from: 'Polkadot',
    to: 'Kusama',
    sender: 'addr1',
    recipient: 'addr2',
    transactOptions: { call: '0x123' },
  } as TSubstrateTransferOptions<unknown, unknown, unknown>

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws ValidationError when sender does not match destination', () => {
    vi.mocked(isHex).mockReturnValue(true)
    vi.mocked(isChainEvm).mockReturnValue(false)
    vi.mocked(compareAddresses).mockReturnValue(false)

    expect(() => validateTransact({ ...baseOptions })).toThrow(ValidationError)
  })
})

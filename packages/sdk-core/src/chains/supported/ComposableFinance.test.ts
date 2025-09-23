import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { transferXTokens } from '../../pallets/xTokens'
import type { TSendInternalOptions, TXTokensTransferOptions } from '../../types'
import { getChain } from '../../utils'
import type ComposableFinance from './ComposableFinance'

vi.mock('../../pallets/xTokens')

describe('ComposableFinance', () => {
  let chain: ComposableFinance<unknown, unknown>
  const mockInput = {
    asset: { symbol: 'LAYR', assetId: '123', amount: 100n }
  } as TXTokensTransferOptions<unknown, unknown>

  const sendOptions = {} as unknown as TSendInternalOptions<unknown, unknown>

  beforeEach(() => {
    chain = getChain<unknown, unknown, 'ComposableFinance'>('ComposableFinance')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('ComposableFinance')
    expect(chain.info).toBe('composable')
    expect(chain.ecosystem).toBe('Polkadot')
    expect(chain.version).toBe(Version.V3)
  })

  it('should call transferXTokens with currencyID', () => {
    chain.transferXTokens(mockInput)
    expect(transferXTokens).toHaveBeenCalledWith(mockInput, 123n)
  })

  it('isSendingTempDisabled should return true', () => {
    expect(chain.isSendingTempDisabled(sendOptions)).toBe(true)
  })

  it('isReceivingTempDisabled should return true', () => {
    expect(chain.isReceivingTempDisabled('ParaToPara')).toBe(true)
  })
})

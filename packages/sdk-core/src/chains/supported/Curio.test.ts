import type { TAssetInfo, WithAmount } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { transferXTokens } from '../../pallets/xTokens'
import type {
  TForeignOrTokenAsset,
  TSendInternalOptions,
  TXTokensTransferOptions
} from '../../types'
import { getChain } from '../../utils'
import type Curio from './Curio'

vi.mock('../../pallets/xTokens')

describe('Curio', () => {
  let chain: Curio<unknown, unknown, unknown>

  const mockInput = {
    asset: {
      symbol: 'CUR',
      assetId: '123',
      amount: 100n
    }
  } as TXTokensTransferOptions<unknown, unknown, unknown>

  const sendOptions = {} as unknown as TSendInternalOptions<unknown, unknown, unknown>

  beforeEach(() => {
    chain = getChain<unknown, unknown, unknown, 'Curio'>('Curio')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('Curio')
    expect(chain.info).toBe('curio')
    expect(chain.ecosystem).toBe('Kusama')
    expect(chain.version).toBe(Version.V3)
  })

  it('should call transferXTokens with ForeignAsset when currencyID is defined', () => {
    chain.transferXTokens(mockInput)
    expect(transferXTokens).toHaveBeenCalledWith(mockInput, {
      ForeignAsset: 123
    } as TForeignOrTokenAsset)
  })

  it('should call transferXTokens with Token when currencyID is undefined', () => {
    const inputWithoutCurrencyID = {
      ...mockInput,
      asset: {
        symbol: 'CUR',
        amount: 100n,
        isNative: true
      } as WithAmount<TAssetInfo>
    }

    chain.transferXTokens(inputWithoutCurrencyID)

    expect(transferXTokens).toHaveBeenCalledWith(inputWithoutCurrencyID, {
      Token: 'CUR'
    } as TForeignOrTokenAsset)
  })

  it('isSendingTempDisabled should return true', () => {
    expect(chain.isSendingTempDisabled(sendOptions)).toBe(true)
  })

  it('isReceivingTempDisabled should return true', () => {
    expect(chain.isReceivingTempDisabled('ParaToPara')).toBe(true)
  })
})

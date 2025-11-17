import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions, TTransferLocalOptions } from '../../types'
import { getChain } from '../../utils'
import type Moonbeam from './Moonbeam'

vi.mock('../../pallets/polkadotXcm')

type WithTransferToEthereum = Moonbeam<unknown, unknown> & {
  transferToEthereum: Moonbeam<unknown, unknown>['transferToEthereum']
}

describe('Moonbeam', () => {
  let chain: Moonbeam<unknown, unknown>

  const api = {
    createAccountId: vi.fn(),
    deserializeExtrinsics: vi.fn()
  } as unknown as IPolkadotApi<unknown, unknown>

  const mockInput = {
    api,
    version: Version.V5,
    senderAddress: 'senderAddress',
    assetInfo: {
      symbol: 'GLMR',
      amount: 100n
    }
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  beforeEach(() => {
    vi.clearAllMocks()
    chain = getChain<unknown, unknown, 'Moonbeam'>('Moonbeam')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('Moonbeam')
    expect(chain.info).toBe('moonbeam')
    expect(chain.ecosystem).toBe('Polkadot')
    expect(chain.version).toBe(Version.V5)
  })

  it('should call transferPolkadotXCM with transfer_assets', async () => {
    await chain.transferPolkadotXCM(mockInput)
    expect(transferPolkadotXcm).toHaveBeenCalledWith(mockInput, 'transfer_assets', 'Unlimited')
  })

  it('should call transferToEthereum when destination is Ethereum', async () => {
    const spyTransferToEth = vi
      .spyOn(chain as WithTransferToEthereum, 'transferToEthereum')
      .mockResolvedValue({})

    const inputEth = {
      ...mockInput,
      destination: 'Ethereum',
      scenario: 'ParaToPara'
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    await chain.transferPolkadotXCM(inputEth)

    expect(spyTransferToEth).toHaveBeenCalledTimes(1)
    expect(spyTransferToEth).toHaveBeenCalledWith(inputEth)

    expect(transferPolkadotXcm).not.toHaveBeenCalled()
  })

  describe('transferLocalNonNativeAsset', () => {
    it('should throw error', () => {
      expect(() =>
        chain.transferLocalNonNativeAsset({} as TTransferLocalOptions<unknown, unknown>)
      ).toThrowError(`${chain.chain} local transfers are temporarily disabled`)
    })
  })
})

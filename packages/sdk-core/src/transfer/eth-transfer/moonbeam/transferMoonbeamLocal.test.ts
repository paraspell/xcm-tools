import type { TAssetInfo, WithAmount } from '@paraspell/assets'
import type { GetContractReturnType, PublicClient, WalletClient } from 'viem'
import { getContract } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { TEvmBuilderOptions } from '../../../types'
import { transferMoonbeamLocal } from './transferMoonbeamLocal'

vi.mock('viem')

vi.mock('../../../utils')

describe('transferMoonbeamLocal', () => {
  const mockTransferFn = vi.fn().mockResolvedValue('0xLocalTxHash')

  const mockViemContract = {
    write: {
      transfer: mockTransferFn
    }
  } as unknown as GetContractReturnType

  const mockClient = {} as PublicClient
  const mockSigner = { account: '0xabc', chain: { id: 1284 } } as unknown as WalletClient
  const mockAddress = '0xRecipientAddress'

  const baseOptions = {
    api: {} as unknown,
    from: 'Moonbeam',
    to: 'Moonbeam',
    signer: mockSigner,
    address: mockAddress,
    currency: { symbol: 'xcDOT', amount: '5000000' }
  } as unknown as TEvmBuilderOptions<unknown, unknown, unknown>

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getContract).mockReturnValue(mockViemContract)
  })

  it('should create a contract using assetId, call transfer with recipient and amount, and return tx hash', async () => {
    const assetInfo: WithAmount<TAssetInfo> = {
      symbol: 'xcDOT',
      assetId: '0xFFFFFFF1FCACBD218EDC0EBA20FC2308C778080',
      decimals: 10,
      location: {},
      amount: 5000000n
    } as WithAmount<TAssetInfo>

    const result = await transferMoonbeamLocal(mockClient, assetInfo, baseOptions)

    expect(getContract).toHaveBeenCalledWith(
      expect.objectContaining({
        address: '0xFFFFFFF1FCACBD218EDC0EBA20FC2308C778080',
        client: {
          public: mockClient,
          wallet: mockSigner
        }
      })
    )
    expect(mockTransferFn).toHaveBeenCalledWith([mockAddress, 5000000n])
    expect(result).toBe('0xLocalTxHash')
  })
})

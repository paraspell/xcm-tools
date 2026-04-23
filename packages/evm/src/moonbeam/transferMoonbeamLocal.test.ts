import type { TAssetInfo, TEvmTransferOptions, WithAmount } from '@paraspell/sdk-core'
import { getContract, type GetContractReturnType, type PublicClient, type WalletClient } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { transferMoonbeamLocal } from './transferMoonbeamLocal'

vi.mock('viem')

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
    recipient: mockAddress,
    currency: { symbol: 'xcDOT', amount: '5000000' }
  } as TEvmTransferOptions<unknown, unknown, unknown>

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getContract).mockReturnValue(mockViemContract)
  })

  it('should create a contract using assetId, call transfer with recipient and amount, and return tx hash', async () => {
    const assetInfo: WithAmount<TAssetInfo> = {
      symbol: 'xcDOT',
      assetId: '0xFFFFFFF1FCACBD218EDC0EBA20FC2308C778080',
      decimals: 10,
      location: { parents: 1, interior: 'Here' },
      amount: 5000000n
    }

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

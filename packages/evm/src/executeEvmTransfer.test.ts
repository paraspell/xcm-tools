import type { PolkadotApi, TEvmTransferOptions } from '@paraspell/sdk-core'
import {
  getEvmExtensionOrThrow,
  MissingParameterError,
  registerEvmExtension,
  UnsupportedOperationError
} from '@paraspell/sdk-core'
import type { Address, WalletClient } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { buildEvmTransfer } from './buildEvmTransfer'

vi.mock('./buildEvmTransfer')

describe('@paraspell/evm', () => {
  const sendTransaction = vi.fn().mockResolvedValue('0xtxhash')
  const account = { address: '0xsender' as Address }
  const chain = { id: 1284 } as never

  const signer = {
    account,
    chain,
    sendTransaction
  } as unknown as WalletClient

  const mockApi = {
    init: () => Promise.resolve(),
    clone: () => ({})
  } as unknown as PolkadotApi<unknown, unknown, unknown>

  const baseOptions: TEvmTransferOptions<unknown, unknown, unknown> = {
    api: mockApi,
    from: 'Moonbeam',
    to: 'AssetHubPolkadot',
    currency: { symbol: 'GLMR', amount: '1' },
    recipient: '0xRecipient',
    signer
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(buildEvmTransfer).mockResolvedValue({
      type: 'eip1559',
      chainId: 1284,
      to: '0xprecompile',
      data: '0xdata',
      value: 0n
    })
  })

  it('registers the extension on import', async () => {
    await import('./index')

    const ext = getEvmExtensionOrThrow()
    expect(typeof ext.executeTransfer).toBe('function')
    expect(typeof ext.buildTransfer).toBe('function')
  })

  it('builds the tx and signs+sends via the WalletClient', async () => {
    await import('./index')
    const { executeEvmTransfer } = await import('./executeEvmTransfer')

    const result = await executeEvmTransfer(baseOptions)

    expect(buildEvmTransfer).toHaveBeenCalledWith({ ...baseOptions, sender: '0xsender' })
    expect(sendTransaction).toHaveBeenCalledWith({
      type: 'eip1559',
      chainId: 1284,
      to: '0xprecompile',
      data: '0xdata',
      value: 0n,
      account,
      chain
    })
    expect(result).toBe('0xtxhash')
  })

  it('throws MissingParameterError when the WalletClient has no account', async () => {
    await import('./index')
    const { executeEvmTransfer } = await import('./executeEvmTransfer')

    await expect(
      executeEvmTransfer({
        ...baseOptions,
        signer: { chain, sendTransaction } as unknown as WalletClient
      })
    ).rejects.toThrow(MissingParameterError)
  })

  it('propagates UnsupportedOperationError from the dispatcher', async () => {
    await import('./index')
    const { executeEvmTransfer } = await import('./executeEvmTransfer')

    vi.mocked(buildEvmTransfer).mockRejectedValueOnce(new UnsupportedOperationError('nope'))

    await expect(executeEvmTransfer(baseOptions)).rejects.toThrow(UnsupportedOperationError)
  })

  it('leaves the registry populated for the whole session (no teardown)', () => {
    expect(() => getEvmExtensionOrThrow()).not.toThrow()
    registerEvmExtension(undefined)
  })
})

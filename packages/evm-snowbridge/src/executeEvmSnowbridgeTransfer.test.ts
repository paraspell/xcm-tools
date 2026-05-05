import type { TEvmTransferOptions } from '@paraspell/sdk-core'
import { MissingParameterError, RoutingResolutionError } from '@paraspell/sdk-core'
import type { PublicClient, WalletClient } from 'viem'
import { createPublicClient, custom } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { buildSnowbridgeTransfer } from './buildSnowbridgeTransfer'
import { executeEvmSnowbridgeTransfer } from './executeEvmSnowbridgeTransfer'

vi.mock('viem', async importOriginal => ({
  ...(await importOriginal()),
  createPublicClient: vi.fn(),
  custom: vi.fn()
}))

vi.mock('./buildSnowbridgeTransfer')

const ACCOUNT = '0x3333333333333333333333333333333333333333'
const RECIPIENT = '0x4444444444444444444444444444444444444444'
const TX_HASH = '0xdeadbeef'

const buildSigner = (overrides: Partial<WalletClient> = {}) =>
  ({
    transport: { type: 'custom' },
    chain: { id: 1 },
    account: { address: ACCOUNT },
    getAddresses: vi.fn().mockResolvedValue([]),
    sendTransaction: vi.fn().mockResolvedValue(TX_HASH),
    ...overrides
  }) as unknown as WalletClient

const baseOptions = (overrides: Partial<Parameters<typeof executeEvmSnowbridgeTransfer>[0]> = {}) =>
  ({
    api: {},
    from: 'Ethereum',
    to: 'AssetHubPolkadot',
    currency: { symbol: 'WETH', amount: '1' },
    recipient: RECIPIENT,
    signer: buildSigner(),
    ...overrides
  }) as TEvmTransferOptions<unknown, unknown, unknown>

describe('executeEvmSnowbridgeTransfer', () => {
  let waitForTransactionReceipt: ReturnType<typeof vi.fn>
  let messageId: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()

    waitForTransactionReceipt = vi.fn().mockResolvedValue({ status: 'success' })
    vi.mocked(createPublicClient).mockReturnValue({
      waitForTransactionReceipt
    } as unknown as PublicClient)

    messageId = vi.fn().mockResolvedValue('0xmsg')
    vi.mocked(buildSnowbridgeTransfer).mockResolvedValue({
      tx: { type: 'eip1559', to: '0xabc', data: '0x', value: 0n, chainId: 1 },
      sender: { messageId } as never
    })
  })

  it('builds, signs, awaits the receipt, and returns the tx hash', async () => {
    const signer = buildSigner()
    const hash = await executeEvmSnowbridgeTransfer(baseOptions({ signer }))

    expect(custom).toHaveBeenCalledWith(signer.transport)
    expect(buildSnowbridgeTransfer).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'Ethereum',
        to: 'AssetHubPolkadot',
        recipient: RECIPIENT,
        sender: ACCOUNT
      }),
      expect.any(Object)
    )
    expect(signer.sendTransaction).toHaveBeenCalledWith({
      type: 'eip1559',
      to: '0xabc',
      data: '0x',
      value: 0n,
      chainId: 1,
      account: { address: ACCOUNT },
      chain: signer.chain
    })
    expect(waitForTransactionReceipt).toHaveBeenCalledWith({ hash: TX_HASH })
    expect(messageId).toHaveBeenCalled()
    expect(hash).toBe(TX_HASH)
  })

  it('falls back to getAddresses() when signer has no pre-attached account', async () => {
    const fallback = '0x5555555555555555555555555555555555555555'
    const signer = buildSigner({
      account: undefined,
      getAddresses: vi.fn().mockResolvedValue([fallback])
    })

    await executeEvmSnowbridgeTransfer(baseOptions({ signer }))

    expect(buildSnowbridgeTransfer).toHaveBeenCalledWith(
      expect.objectContaining({ sender: fallback }),
      expect.any(Object)
    )
    expect(signer.sendTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ account: fallback })
    )
  })

  it('throws MissingParameterError when no account is available', async () => {
    const signer = buildSigner({
      account: undefined,
      getAddresses: vi.fn().mockResolvedValue([])
    })

    await expect(executeEvmSnowbridgeTransfer(baseOptions({ signer }))).rejects.toThrow(
      MissingParameterError
    )
  })

  it('throws RoutingResolutionError when the transaction receipt is not success', async () => {
    waitForTransactionReceipt.mockResolvedValue({ status: 'reverted' })

    await expect(executeEvmSnowbridgeTransfer(baseOptions())).rejects.toThrow(/not included/)
  })

  it('throws RoutingResolutionError when no message id is emitted', async () => {
    messageId.mockResolvedValue(undefined)

    await expect(executeEvmSnowbridgeTransfer(baseOptions())).rejects.toThrow(
      /did not emit a message/
    )
    await expect(executeEvmSnowbridgeTransfer(baseOptions())).rejects.toThrow(
      RoutingResolutionError
    )
  })
})

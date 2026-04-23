import type { TAssetInfo, TEvmTransferOptions } from '@paraspell/sdk-core'
import {
  abstractDecimals,
  assertHasId,
  findAssetInfoOrThrow,
  getParaId,
  isOverrideLocationSpecifier,
  MissingParameterError,
  RoutingResolutionError,
  UnsupportedOperationError
} from '@paraspell/sdk-core'
import { SnowbridgeApi, toPolkadotV2 } from '@snowbridge/api'
import type { BridgeInfo, Environment } from '@snowbridge/base-types'
import { ViemEthereumProvider } from '@snowbridge/provider-viem'
import { bridgeInfoFor } from '@snowbridge/registry'
import type { PublicClient, WalletClient } from 'viem'
import { createPublicClient, custom } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createEnvironment } from './createEnvironment'
import { executeEvmSnowbridgeTransfer } from './executeEvmSnowbridgeTransfer'

const { senderMethods, setEthProvider, senderFactory } = vi.hoisted(() => {
  const senderMethods = {
    fee: vi.fn(),
    tx: vi.fn(),
    validate: vi.fn(),
    messageId: vi.fn()
  }
  return {
    senderMethods,
    setEthProvider: vi.fn(),
    senderFactory: vi.fn(() => senderMethods)
  }
})

vi.mock('@paraspell/sdk-core', async importOriginal => ({
  ...(await importOriginal()),
  abstractDecimals: vi.fn(),
  assertHasId: vi.fn(),
  findAssetInfoOrThrow: vi.fn(),
  getParaId: vi.fn(),
  isOverrideLocationSpecifier: vi.fn()
}))

vi.mock('@snowbridge/api', () => ({
  SnowbridgeApi: vi.fn(),
  toPolkadotV2: {
    ValidationKind: { Warning: 0, Error: 1 }
  }
}))

vi.mock('@snowbridge/provider-viem')

vi.mock('@snowbridge/registry')

vi.mock('viem', async importOriginal => ({
  ...(await importOriginal()),
  createPublicClient: vi.fn(),
  custom: vi.fn()
}))

vi.mock('./createEnvironment')

const ASSET_ID = '0x2222222222222222222222222222222222222222'
const ACCOUNT = '0x3333333333333333333333333333333333333333'
const RECIPIENT = '0x4444444444444444444444444444444444444444'
const TX_HASH = '0xdeadbeef'

const ethAsset: TAssetInfo = {
  symbol: 'WETH',
  decimals: 18,
  assetId: ASSET_ID,
  location: { parents: 0, interior: 'Here' }
}

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

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(SnowbridgeApi).mockImplementation(function (this: {
      context: { setEthProvider: typeof setEthProvider }
      sender: typeof senderFactory
    }) {
      this.context = { setEthProvider }
      this.sender = senderFactory
    } as unknown as typeof SnowbridgeApi)

    vi.mocked(findAssetInfoOrThrow).mockReturnValue(ethAsset)
    vi.mocked(abstractDecimals).mockReturnValue(1_000n)
    vi.mocked(getParaId).mockReturnValue(1000)
    vi.mocked(isOverrideLocationSpecifier).mockReturnValue(false)

    vi.mocked(bridgeInfoFor).mockReturnValue({
      environment: { ethChainId: 1 }
    } as unknown as BridgeInfo)

    vi.mocked(createEnvironment).mockReturnValue({
      ethChainId: 1
    } as Environment)

    waitForTransactionReceipt = vi.fn().mockResolvedValue({ status: 'success' })
    vi.mocked(createPublicClient).mockReturnValue({
      waitForTransactionReceipt
    } as unknown as PublicClient)

    senderMethods.fee.mockResolvedValue({ fee: 10n })
    senderMethods.tx.mockResolvedValue({ tx: { to: '0xabc', data: '0x' } })
    senderMethods.validate.mockResolvedValue({ logs: [] })
    senderMethods.messageId.mockResolvedValue('0xmsg')
  })

  it('throws UnsupportedOperationError when currency is an array', async () => {
    await expect(executeEvmSnowbridgeTransfer(baseOptions({ currency: [] }))).rejects.toThrow(
      UnsupportedOperationError
    )
  })

  it('throws UnsupportedOperationError when currency uses an override location', async () => {
    vi.mocked(isOverrideLocationSpecifier).mockReturnValue(true)

    await expect(
      executeEvmSnowbridgeTransfer(
        baseOptions({
          currency: {
            location: { type: 'Override', value: { parents: 0, interior: 'Here' } },
            amount: '1'
          }
        })
      )
    ).rejects.toThrow(UnsupportedOperationError)
  })

  it('executes a successful transfer and returns the tx hash', async () => {
    const signer = buildSigner()
    const hash = await executeEvmSnowbridgeTransfer(baseOptions({ signer }))

    expect(hash).toBe(TX_HASH)

    expect(findAssetInfoOrThrow).toHaveBeenCalledWith(
      'Ethereum',
      { symbol: 'WETH', amount: '1' },
      'AssetHubPolkadot'
    )
    expect(abstractDecimals).toHaveBeenCalledWith('1', ethAsset.decimals, expect.any(Object))
    expect(SnowbridgeApi).toHaveBeenCalledTimes(1)
    expect(ViemEthereumProvider).toHaveBeenCalledTimes(1)
    expect(custom).toHaveBeenCalledWith(signer.transport)
    expect(createPublicClient).toHaveBeenCalled()
    expect(setEthProvider).toHaveBeenCalledWith(1, expect.any(Object))
    expect(senderFactory).toHaveBeenCalledWith(
      { kind: 'ethereum', id: 1 },
      { kind: 'polkadot', id: 1000 }
    )
    expect(assertHasId).toHaveBeenCalledWith(ethAsset)
    expect(senderMethods.fee).toHaveBeenCalledWith(ASSET_ID)
    expect(senderMethods.tx).toHaveBeenCalledWith(ACCOUNT, RECIPIENT, ASSET_ID, 1_000n, {
      fee: 10n
    })
    expect(senderMethods.validate).toHaveBeenCalled()
    expect(signer.sendTransaction).toHaveBeenCalledWith({
      to: '0xabc',
      data: '0x',
      account: { address: ACCOUNT },
      chain: signer.chain
    })
    expect(waitForTransactionReceipt).toHaveBeenCalledWith({ hash: TX_HASH })
    expect(senderMethods.messageId).toHaveBeenCalled()
  })

  it('falls back to getAddresses() when signer has no pre-attached account', async () => {
    const fallback = '0x5555555555555555555555555555555555555555'
    const signer = buildSigner({
      account: undefined,
      getAddresses: vi.fn().mockResolvedValue([fallback])
    })

    await executeEvmSnowbridgeTransfer(baseOptions({ signer }))

    expect(signer.getAddresses).toHaveBeenCalled()
    expect(senderMethods.tx).toHaveBeenCalledWith(fallback, RECIPIENT, ASSET_ID, 1_000n, {
      fee: 10n
    })
    expect(signer.sendTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ account: fallback })
    )
  })

  it('passes chain=null when signer.chain is undefined', async () => {
    const signer = buildSigner({ chain: undefined })

    await executeEvmSnowbridgeTransfer(baseOptions({ signer }))

    expect(signer.sendTransaction).toHaveBeenCalledWith(expect.objectContaining({ chain: null }))
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

  it('throws RoutingResolutionError when validation reports an error log', async () => {
    senderMethods.validate.mockResolvedValue({
      logs: [
        { kind: toPolkadotV2.ValidationKind.Warning, message: 'ignored warning' },
        { kind: toPolkadotV2.ValidationKind.Error, message: 'error1' },
        { kind: toPolkadotV2.ValidationKind.Error, message: 'error2' }
      ]
    })

    await expect(executeEvmSnowbridgeTransfer(baseOptions())).rejects.toThrow(/error1[\s\S]*error2/)
    await expect(executeEvmSnowbridgeTransfer(baseOptions())).rejects.toThrow(
      RoutingResolutionError
    )
  })

  it('throws RoutingResolutionError when the transaction receipt is not success', async () => {
    waitForTransactionReceipt.mockResolvedValue({ status: 'reverted' })

    await expect(executeEvmSnowbridgeTransfer(baseOptions())).rejects.toThrow(/not included/)
  })

  it('throws RoutingResolutionError when no message id is emitted', async () => {
    senderMethods.messageId.mockResolvedValue(undefined)

    await expect(executeEvmSnowbridgeTransfer(baseOptions())).rejects.toThrow(
      /did not emit a message/
    )
  })
})

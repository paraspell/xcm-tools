/* eslint-disable @typescript-eslint/unbound-method */
import type { TAssetInfo, WithAmount } from '@paraspell/assets'
import { findAssetInfo, findAssetInfoOrThrow, getNativeAssetSymbol } from '@paraspell/assets'
import { getNativeAssetsPallet, getOtherAssetsPallets } from '@paraspell/pallets'
import { parseUnits } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { getPalletInstance } from '../../pallets'
import { wrapTxBypass } from './wrapTxBypass'

vi.mock('@paraspell/assets', async importOriginal => ({
  ...(await importOriginal<typeof import('@paraspell/assets')>()),
  findAssetInfo: vi.fn(),
  findAssetInfoOrThrow: vi.fn(),
  getNativeAssetSymbol: vi.fn(),
  isSymbolMatch: vi.fn((a: string, b: string) => a.toLowerCase() === b.toLowerCase())
}))

vi.mock('@paraspell/pallets')

vi.mock('../../pallets', () => ({
  getPalletInstance: vi.fn((pallet: string) => ({
    setBalance: vi.fn((_address: string, assetWithAmount: { symbol: string }, _chain: string) => {
      const base = {
        balanceTx: { module: pallet, method: `${pallet}:set_balance:${assetWithAmount.symbol}` }
      }
      if (String(pallet).startsWith('Foreign')) {
        return {
          ...base,
          assetStatusTx: { module: pallet, method: `${pallet}:status:${assetWithAmount.symbol}` }
        }
      }
      return base
    })
  }))
}))

vi.mock('viem', () => ({
  parseUnits: vi.fn(() => 42n)
}))

const mkApi = () => {
  const callTxMethod = vi.fn((tx: { method: string }) => `call:${tx.method}`)
  const callDispatchAsMethod = vi.fn(
    (inner: unknown, addr: string) => `dispatchAs(${addr})->${String(inner)}`
  )
  const callBatchMethod = vi.fn((arr: unknown[], mode: unknown) => ({ arr, mode }))
  return { callTxMethod, callDispatchAsMethod, callBatchMethod } as unknown as IPolkadotApi<
    unknown,
    unknown
  >
}

describe('wrapTxBypass', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getNativeAssetSymbol).mockReturnValue('ACA')
    vi.mocked(getNativeAssetsPallet).mockReturnValue('Balances')
    vi.mocked(getOtherAssetsPallets).mockReturnValue(['ForeignAssets', 'Tokens'])
  })

  it('batches native + relay + fee + main-asset mints in order, using ForeignAssets for foreign assets', async () => {
    const api = mkApi()
    const chain = 'Acala'
    const address = 'Alice'
    const originalTx = 'ORIG_TX'

    const nativeAsset = { symbol: 'ACA', decimals: 12 } as TAssetInfo
    const relayAsset = { symbol: 'RelayDOT', decimals: 10 } as TAssetInfo
    const feeAsset = { symbol: 'USDC', decimals: 6, assetId: undefined } as TAssetInfo
    const mainAsset = {
      symbol: 'USDT',
      decimals: 6,
      assetId: undefined,
      amount: 1000n
    } as WithAmount<TAssetInfo>

    vi.mocked(findAssetInfoOrThrow).mockReturnValue(nativeAsset)
    vi.mocked(findAssetInfo).mockReturnValue(relayAsset)

    const result = await wrapTxBypass(api, chain, mainAsset, feeAsset, address, originalTx)
    expect(result).toBeDefined()

    expect(parseUnits).toHaveBeenCalledTimes(4)
    expect(parseUnits).toHaveBeenNthCalledWith(1, '1000', nativeAsset.decimals)
    expect(parseUnits).toHaveBeenNthCalledWith(2, '1000', relayAsset.decimals)
    expect(parseUnits).toHaveBeenNthCalledWith(3, '1000', feeAsset.decimals)
    expect(parseUnits).toHaveBeenNthCalledWith(4, '1000', mainAsset.decimals)

    const instanceCalls = vi.mocked(getPalletInstance).mock.calls.map(c => c[0])
    expect(instanceCalls).toContain('Balances')
    expect(instanceCalls.filter(p => p === 'ForeignAssets')).toHaveLength(3)

    expect(api.callBatchMethod).toHaveBeenCalledTimes(1)
    const [[batched, mode]] = vi.mocked(api.callBatchMethod).mock.calls
    expect(Array.isArray(batched)).toBe(true)
    expect(batched).toEqual([
      'call:Balances:set_balance:ACA',
      'call:ForeignAssets:status:RelayDOT',
      'dispatchAs(Alice)->call:ForeignAssets:set_balance:RelayDOT',
      'call:ForeignAssets:status:USDC',
      'dispatchAs(Alice)->call:ForeignAssets:set_balance:USDC',
      'call:ForeignAssets:status:USDT',
      'dispatchAs(Alice)->call:ForeignAssets:set_balance:USDT',
      'dispatchAs(Alice)->ORIG_TX'
    ])
    expect(mode).toBeDefined()
  })

  it('skips relay and fee when unavailable/undefined; still mints native + main asset and dispatches original tx', async () => {
    const api = mkApi()
    const chain = 'Acala'
    const address = 'Alice'
    const originalTx = 'ORIG_TX'

    const nativeAsset = { symbol: 'ACA', decimals: 12 } as TAssetInfo
    const mainAsset = {
      symbol: 'USDT',
      decimals: 6,
      assetId: undefined,
      amount: 1000n
    } as WithAmount<TAssetInfo>

    vi.mocked(findAssetInfoOrThrow).mockReturnValue(nativeAsset)
    vi.mocked(findAssetInfo).mockReturnValue(null)

    const result = await wrapTxBypass(api, chain, mainAsset, undefined, address, originalTx)
    expect(result).toBeDefined()

    expect(parseUnits).toHaveBeenCalledTimes(2)

    const [[batched]] = vi.mocked(api.callBatchMethod).mock.calls
    expect(batched).toEqual([
      'call:Balances:set_balance:ACA',
      'call:ForeignAssets:status:USDT',
      'dispatchAs(Alice)->call:ForeignAssets:set_balance:USDT',
      'dispatchAs(Alice)->ORIG_TX'
    ])
  })

  it('uses first non-Foreign pallet from otherPallets when asset is non-native and not foreign', async () => {
    const api = mkApi()
    const chain = 'Acala'
    const address = 'Alice'
    const originalTx = 'ORIG_TX'

    vi.mocked(getOtherAssetsPallets).mockReturnValue(['Tokens'])

    const nativeAsset = { symbol: 'ACA', decimals: 12, isNative: true } as TAssetInfo
    const mainAsset = {
      symbol: 'KSM',
      decimals: 1,
      assetId: undefined,
      amount: 1000n
    } as WithAmount<TAssetInfo>

    vi.mocked(findAssetInfoOrThrow).mockReturnValue(nativeAsset)
    vi.mocked(findAssetInfo).mockReturnValue(null)

    const result = await wrapTxBypass(api, chain, mainAsset, undefined, address, originalTx)
    expect(result).toBeDefined()

    const palletsUsed = vi.mocked(getPalletInstance).mock.calls.map(c => c[0])
    expect(palletsUsed).toContain('Balances')
    expect(palletsUsed).toContain('Tokens')

    const [[batched]] = vi.mocked(api.callBatchMethod).mock.calls
    expect(batched).toEqual([
      'call:Balances:set_balance:ACA',
      'call:Tokens:set_balance:KSM',
      'dispatchAs(Alice)->ORIG_TX'
    ])
  })
})

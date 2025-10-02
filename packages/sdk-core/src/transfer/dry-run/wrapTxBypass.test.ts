/* eslint-disable @typescript-eslint/unbound-method */
import type { TAssetInfo, WithAmount } from '@paraspell/assets'
import {
  findAssetInfo,
  findAssetInfoOrThrow,
  getNativeAssetSymbol,
  isForeignAsset
} from '@paraspell/assets'
import { getNativeAssetsPallet, getOtherAssetsPallets } from '@paraspell/pallets'
import { parseUnits } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { getPalletInstance } from '../../pallets'
import { getAssetBalanceInternal } from '../../pallets/assets'
import { getCurrencySelection } from '../../utils/asset'
import { wrapTxBypass } from './wrapTxBypass'

vi.mock('@paraspell/assets', async importOriginal => ({
  ...(await importOriginal<typeof import('@paraspell/assets')>()),
  findAssetInfo: vi.fn(),
  findAssetInfoOrThrow: vi.fn(),
  getNativeAssetSymbol: vi.fn(),
  isSymbolMatch: vi.fn((a: string, b: string) => a.toLowerCase() === b.toLowerCase()),
  isForeignAsset: vi.fn((asset: Partial<TAssetInfo> & { __foreign?: boolean }) => !!asset.__foreign)
}))

vi.mock('@paraspell/pallets')

vi.mock('../../pallets', () => ({
  getPalletInstance: vi.fn((pallet: string) => ({
    mint: vi.fn((_address: string, assetWithAmount: { symbol?: string }, _chain: string) => {
      const sym = assetWithAmount.symbol ?? 'Unknown'
      const base = {
        balanceTx: { module: pallet, method: `${pallet}:set_balance:${sym}` }
      }
      if (String(pallet).startsWith('Foreign')) {
        return {
          ...base,
          assetStatusTx: { module: pallet, method: `${pallet}:status:${sym}` }
        }
      }
      return base
    })
  }))
}))

vi.mock('../../pallets/assets')

vi.mock('viem', () => ({
  parseUnits: vi.fn((v: string) => BigInt(v))
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

describe('wrapTxBypass (existing cases)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getNativeAssetSymbol).mockReturnValue('ACA')
    vi.mocked(getNativeAssetsPallet).mockReturnValue('Balances')
    vi.mocked(getOtherAssetsPallets).mockReturnValue(['ForeignAssets', 'Tokens'])
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(2000n)
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
    vi.mocked(findAssetInfo).mockReturnValueOnce(relayAsset).mockReturnValue(relayAsset)

    const result = await wrapTxBypass({
      api,
      chain,
      address,
      asset: mainAsset,
      feeAsset,
      tx: originalTx
    })
    expect(result).toBeDefined()

    expect(parseUnits).toHaveBeenCalledTimes(4)
    expect(parseUnits).toHaveBeenNthCalledWith(1, '1000', nativeAsset.decimals)

    const remainingDecs = vi
      .mocked(parseUnits)
      .mock.calls.slice(1)
      .map(([, d]) => d)
    expect(remainingDecs).toEqual(expect.arrayContaining([feeAsset.decimals, mainAsset.decimals]))

    const [[batched]] = vi.mocked(api.callBatchMethod).mock.calls
    expect(batched).toEqual(
      expect.arrayContaining([
        'call:Balances:set_balance:ACA',
        'call:ForeignAssets:status:USDC',
        'dispatchAs(Alice)->call:ForeignAssets:set_balance:USDC',
        'call:ForeignAssets:status:USDT',
        'dispatchAs(Alice)->call:ForeignAssets:set_balance:USDT',
        'dispatchAs(Alice)->ORIG_TX'
      ])
    )
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

    const result = await wrapTxBypass({
      api,
      chain,
      address,
      asset: mainAsset,
      tx: originalTx
    })
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

    const result = await wrapTxBypass({
      api,
      chain,
      address,
      asset: mainAsset,
      tx: originalTx
    })
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

  it('sentAssetMintMode="bypass" still reads balance once and mints +1000 preview amount', async () => {
    const api = mkApi()
    const chain = 'Acala'
    const address = 'Alice'
    const originalTx = 'ORIG_TX'

    const nativeAsset = { symbol: 'ACA', decimals: 12 } as TAssetInfo
    const mainAsset = {
      symbol: 'USDT',
      decimals: 6,
      assetId: undefined,
      amount: 5n
    } as WithAmount<TAssetInfo>

    vi.mocked(findAssetInfoOrThrow).mockReturnValue(nativeAsset)
    vi.mocked(findAssetInfo).mockReturnValue(null)

    const result = await wrapTxBypass(
      { api, chain, address, asset: mainAsset, tx: originalTx },
      { mintFeeAssets: true, sentAssetMintMode: 'bypass' }
    )
    expect(result).toBeDefined()

    expect(parseUnits).toHaveBeenCalledTimes(2)
    expect(parseUnits).toHaveBeenNthCalledWith(1, '1000', nativeAsset.decimals)
    expect(parseUnits).toHaveBeenNthCalledWith(2, '1000', mainAsset.decimals)

    expect(getAssetBalanceInternal).toHaveBeenCalledOnce()

    const [[batched]] = vi.mocked(api.callBatchMethod).mock.calls
    expect(batched).toEqual([
      'call:Balances:set_balance:ACA',
      'call:ForeignAssets:status:USDT',
      'dispatchAs(Alice)->call:ForeignAssets:set_balance:USDT',
      'dispatchAs(Alice)->ORIG_TX'
    ])
  })
})

describe('getCurrencySelection (new coverage)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns location when provided', () => {
    const asset = {
      symbol: 'XYZ',
      location: { parents: 0, interior: { Here: null } }
    } as unknown as TAssetInfo
    const res = getCurrencySelection(asset)
    expect('location' in res).toBe(true)
  })

  it('returns id when foreign + assetId present', () => {
    const asset = {
      __foreign: true,
      assetId: 1234,
      symbol: 'USDC'
    } as unknown as TAssetInfo
    expect(isForeignAsset(asset)).toBe(true)
    const res = getCurrencySelection(asset)
    expect(res).toEqual({ id: 1234 })
  })

  it('falls back to symbol otherwise', () => {
    const asset = { symbol: 'DOT' } as unknown as TAssetInfo
    const res = getCurrencySelection(asset)
    expect(res).toEqual({ symbol: 'DOT' })
  })
})

describe('wrapTxBypass (new branches)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getNativeAssetSymbol).mockReturnValue('ACA')
    vi.mocked(getNativeAssetsPallet).mockReturnValue('Balances')
    vi.mocked(getOtherAssetsPallets).mockReturnValue(['ForeignAssets', 'Tokens'])
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(2000n)
  })

  it('sentAssetMintMode="preview" reads balance and mints (missing + bonus) where applicable', async () => {
    const api = mkApi()
    const chain = 'Acala'
    const address = 'Alice'
    const originalTx = 'ORIG_TX'

    const nativeAsset = { symbol: 'ACA', decimals: 12 } as TAssetInfo
    const mainAsset = {
      symbol: 'USDT',
      decimals: 6,
      assetId: undefined,
      amount: 5n
    } as WithAmount<TAssetInfo>

    vi.mocked(findAssetInfoOrThrow).mockReturnValue(nativeAsset)
    vi.mocked(findAssetInfo).mockReturnValue(null)

    const res = await wrapTxBypass(
      { api, chain, address, asset: mainAsset, tx: originalTx },
      { mintFeeAssets: true, sentAssetMintMode: 'preview' }
    )
    expect(res).toBeDefined()

    expect(parseUnits).toHaveBeenNthCalledWith(1, '1000', nativeAsset.decimals)
    expect(getAssetBalanceInternal).toHaveBeenCalledTimes(1)

    const [[batched]] = vi.mocked(api.callBatchMethod).mock.calls
    expect(batched).toContain('dispatchAs(Alice)->ORIG_TX')
    expect(batched.join('|')).not.toMatch(/USDT/)
  })

  it('mintFeeAssets=false skips native/relay/fee mints and only mints main asset + dispatches original tx', async () => {
    const api = mkApi()
    const chain = 'Acala'
    const address = 'Alice'
    const originalTx = 'ORIG_TX'

    const nativeAsset = { symbol: 'ACA', decimals: 12 } as TAssetInfo
    const mainAsset = {
      symbol: 'USDT',
      decimals: 6,
      assetId: undefined,
      amount: 7n
    } as WithAmount<TAssetInfo>

    vi.mocked(findAssetInfoOrThrow).mockReturnValue(nativeAsset)
    vi.mocked(findAssetInfo).mockReturnValue({ symbol: 'RelayDOT', decimals: 10 } as TAssetInfo)

    const result = await wrapTxBypass(
      {
        api,
        chain,
        address,
        asset: mainAsset,
        feeAsset: { symbol: 'USDC', decimals: 6 } as TAssetInfo,
        tx: originalTx
      },
      { mintFeeAssets: false, sentAssetMintMode: 'bypass' }
    )
    expect(result).toBeDefined()

    const [[batched]] = vi.mocked(api.callBatchMethod).mock.calls
    expect(batched.join('|')).not.toMatch(/Balances:set_balance:ACA/)
    expect(batched.join('|')).not.toMatch(/RelayDOT/)
    expect(batched.join('|')).not.toMatch(/USDC/)

    expect(batched).toEqual([
      'call:ForeignAssets:status:USDT',
      'dispatchAs(Alice)->call:ForeignAssets:set_balance:USDT',
      'dispatchAs(Alice)->ORIG_TX'
    ])
  })

  it('does not mint relay twice when relay equals native (dedupe) and still mints main asset', async () => {
    const api = mkApi()
    const chain = 'Acala'
    const address = 'Alice'
    const originalTx = 'ORIG_TX'

    const nativeRelay = { symbol: 'ACA', decimals: 12 } as TAssetInfo
    const mainAsset = {
      symbol: 'USDT',
      decimals: 6,
      assetId: undefined,
      amount: 1000n
    } as WithAmount<TAssetInfo>

    vi.mocked(findAssetInfoOrThrow).mockReturnValue(nativeRelay)
    vi.mocked(findAssetInfo).mockReturnValue(nativeRelay)

    const res = await wrapTxBypass({
      api,
      chain,
      address,
      asset: mainAsset,
      tx: originalTx
    })
    expect(res).toBeDefined()

    const [[batched]] = vi.mocked(api.callBatchMethod).mock.calls
    const nativeMints = batched.filter(x => String(x).includes('Balances:set_balance:ACA'))
    const relayMints = batched.filter(x => String(x).includes('status:RelayDOT'))
    expect(nativeMints.length).toBe(1)
    expect(relayMints.length).toBe(0)

    expect(batched.join('|')).toMatch(/ForeignAssets:status:USDT/)
  })

  it('preview mode adds +1000 bonus when the sent asset equals the pre-minted native asset', async () => {
    const api = mkApi()
    const chain = 'Acala'
    const address = 'Alice'
    const originalTx = 'ORIG_TX'

    const nativeAsset = { symbol: 'ACA', decimals: 12 } as TAssetInfo
    const mainAssetIsNative = {
      symbol: 'ACA',
      decimals: 12,
      assetId: undefined,
      amount: 5n
    } as WithAmount<TAssetInfo>

    vi.mocked(findAssetInfoOrThrow).mockReturnValue(nativeAsset)
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(0n)

    vi.mocked(findAssetInfo).mockImplementation(() => nativeAsset)

    const res = await wrapTxBypass(
      { api, chain, address, asset: mainAssetIsNative, tx: originalTx },
      { mintFeeAssets: true, sentAssetMintMode: 'preview' }
    )
    expect(res).toBeDefined()

    const [[batched]] = vi.mocked(api.callBatchMethod).mock.calls
    const acaMints = batched.filter(x => String(x) === 'call:Balances:set_balance:ACA')
    expect(acaMints.length).toBeGreaterThanOrEqual(2)
    expect(batched).toContain('dispatchAs(Alice)->ORIG_TX')
  })
})

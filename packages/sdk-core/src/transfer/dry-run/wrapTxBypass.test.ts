import type { TAssetInfo, WithAmount } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
import { getAssetBalanceInternal } from '../../balance'
import { parseUnits } from '../../utils/unit'
import { wrapTxBypass } from './wrapTxBypass'

vi.mock('../../chains/getChainInstance', () => ({
  getChainImpl: vi.fn(() => ({
    mint: vi.fn(
      (_api: unknown, _address: string, asset: { symbol?: string; isNative?: boolean }) => {
        const sym = asset.symbol ?? 'Unknown'
        const balanceTx = { module: 'Mint', method: `Mint:set_balance:${sym}` }
        return asset.isNative
          ? { balanceTx }
          : { balanceTx, assetStatusTx: { module: 'Mint', method: `Mint:status:${sym}` } }
      }
    )
  }))
}))

vi.mock('../../balance')

vi.mock('../../utils/unit', () => ({
  parseUnits: vi.fn((v: string) => BigInt(v))
}))

const mkApi = () => {
  const deserializeExtrinsics = vi.fn((tx: { method: string }) => `call:${tx.method}`)
  const callDispatchAsMethod = vi.fn(
    (inner: unknown, addr: string) => `dispatchAs(${addr})->${String(inner)}`
  )
  const callBatchMethod = vi.fn((arr: unknown[], mode: unknown) => ({ arr, mode }))
  const api = {
    deserializeExtrinsics,
    callDispatchAsMethod,
    callBatchMethod,
    findAssetInfo: vi.fn(),
    findNativeAssetInfo: vi.fn(),
    findNativeAssetInfoOrThrow: vi.fn()
  } as unknown as PolkadotApi<unknown, unknown, unknown>
  const spies = {
    callBatchMethod: vi.spyOn(api, 'callBatchMethod'),
    findAssetInfo: vi.spyOn(api, 'findAssetInfo'),
    findNativeAssetInfo: vi.spyOn(api, 'findNativeAssetInfo'),
    findNativeAssetInfoOrThrow: vi.spyOn(api, 'findNativeAssetInfoOrThrow')
  }
  return { api, spies }
}

const version = Version.V5

describe('wrapTxBypass', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(2000n)
  })

  it('batches native + relay + fee + main-asset mints in order', async () => {
    const { api, spies } = mkApi()
    const chain = 'Acala'
    const address = 'Alice'
    const originalTx = 'ORIG_TX'

    const nativeAsset: TAssetInfo = {
      symbol: 'ACA',
      decimals: 12,
      isNative: true,
      location: { parents: 1, interior: { X1: [{ Parachain: 2000 }] } }
    }

    const relayAsset: TAssetInfo = {
      symbol: 'DOT',
      decimals: 10,
      location: { parents: 1, interior: 'Here' }
    }

    const feeAsset: TAssetInfo = {
      symbol: 'USDC',
      decimals: 6,
      location: { parents: 1, interior: { X1: [{ Parachain: 1000 }] } }
    }

    const mainAsset: WithAmount<TAssetInfo> = {
      symbol: 'USDT',
      decimals: 6,
      location: { parents: 1, interior: { X2: [{ Parachain: 1000 }, { GeneralIndex: '0x01' }] } },
      amount: 1000n
    }

    spies.findNativeAssetInfo.mockReturnValue(nativeAsset)
    spies.findNativeAssetInfoOrThrow.mockReturnValue(nativeAsset)
    spies.findAssetInfo.mockReturnValueOnce(relayAsset).mockReturnValue(relayAsset)

    const result = await wrapTxBypass({
      api,
      chain,
      address,
      asset: mainAsset,
      feeAsset,
      version,
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

    const [[batched]] = spies.callBatchMethod.mock.calls
    expect(batched).toEqual(
      expect.arrayContaining([
        'call:Mint:set_balance:ACA',
        'call:Mint:status:USDC',
        'dispatchAs(Alice)->call:Mint:set_balance:USDC',
        'call:Mint:status:USDT',
        'dispatchAs(Alice)->call:Mint:set_balance:USDT',
        'dispatchAs(Alice)->ORIG_TX'
      ])
    )
  })

  it('skips relay and fee when unavailable/undefined; still mints native + main asset and dispatches original tx', async () => {
    const { api, spies } = mkApi()
    const chain = 'Acala'
    const address = 'Alice'
    const originalTx = 'ORIG_TX'

    const nativeAsset = {
      symbol: 'ACA',
      decimals: 12,
      isNative: true,
      location: { parents: 1, interior: { X1: [{ Parachain: 2000 }] } }
    } as TAssetInfo
    const mainAsset = {
      symbol: 'USDT',
      decimals: 6,
      assetId: undefined,
      amount: 1000n
    } as WithAmount<TAssetInfo>

    spies.findNativeAssetInfo.mockReturnValue(nativeAsset)
    spies.findNativeAssetInfoOrThrow.mockReturnValue(nativeAsset)
    spies.findAssetInfo.mockReturnValue(null)

    const result = await wrapTxBypass({
      api,
      chain,
      address,
      asset: mainAsset,
      version,
      tx: originalTx
    })
    expect(result).toBeDefined()

    expect(parseUnits).toHaveBeenCalledTimes(2)

    const [[batched]] = spies.callBatchMethod.mock.calls
    expect(batched).toEqual([
      'call:Mint:set_balance:ACA',
      'call:Mint:status:USDT',
      'dispatchAs(Alice)->call:Mint:set_balance:USDT',
      'dispatchAs(Alice)->ORIG_TX'
    ])
  })

  it('sentAssetMintMode="bypass" still reads balance once and mints +1000 preview amount', async () => {
    const { api, spies } = mkApi()
    const chain = 'Acala'
    const address = 'Alice'
    const originalTx = 'ORIG_TX'

    const nativeAsset = {
      symbol: 'ACA',
      decimals: 12,
      isNative: true,
      location: { parents: 1, interior: { X1: [{ Parachain: 2000 }] } }
    } as TAssetInfo
    const mainAsset = {
      symbol: 'USDT',
      decimals: 6,
      assetId: undefined,
      amount: 5n
    } as WithAmount<TAssetInfo>

    spies.findNativeAssetInfo.mockReturnValue(nativeAsset)
    spies.findNativeAssetInfoOrThrow.mockReturnValue(nativeAsset)
    spies.findAssetInfo.mockReturnValue(null)

    const result = await wrapTxBypass(
      { api, chain, address, version, asset: mainAsset, tx: originalTx },
      { mintFeeAssets: true, sentAssetMintMode: 'bypass' }
    )
    expect(result).toBeDefined()

    expect(parseUnits).toHaveBeenCalledTimes(2)
    expect(parseUnits).toHaveBeenNthCalledWith(1, '1000', nativeAsset.decimals)
    expect(parseUnits).toHaveBeenNthCalledWith(2, '1000', mainAsset.decimals)

    expect(getAssetBalanceInternal).toHaveBeenCalledOnce()

    const [[batched]] = spies.callBatchMethod.mock.calls
    expect(batched).toEqual([
      'call:Mint:set_balance:ACA',
      'call:Mint:status:USDT',
      'dispatchAs(Alice)->call:Mint:set_balance:USDT',
      'dispatchAs(Alice)->ORIG_TX'
    ])
  })
})

describe('wrapTxBypass (new branches)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(2000n)
  })

  it('sentAssetMintMode="preview" reads balance and mints (missing + bonus) where applicable', async () => {
    const { api, spies } = mkApi()
    const chain = 'Acala'
    const address = 'Alice'
    const originalTx = 'ORIG_TX'

    const nativeAsset = {
      symbol: 'ACA',
      decimals: 12,
      isNative: true,
      location: { parents: 1, interior: { X1: [{ Parachain: 2000 }] } }
    } as TAssetInfo
    const mainAsset = {
      symbol: 'USDT',
      decimals: 6,
      assetId: undefined,
      amount: 5n
    } as WithAmount<TAssetInfo>

    spies.findNativeAssetInfo.mockReturnValue(nativeAsset)
    spies.findNativeAssetInfoOrThrow.mockReturnValue(nativeAsset)
    spies.findAssetInfo.mockReturnValue(null)

    const res = await wrapTxBypass(
      { api, chain, address, version, asset: mainAsset, tx: originalTx },
      { mintFeeAssets: true, sentAssetMintMode: 'preview' }
    )
    expect(res).toBeDefined()

    expect(parseUnits).toHaveBeenNthCalledWith(1, '1000', nativeAsset.decimals)
    expect(getAssetBalanceInternal).toHaveBeenCalledTimes(1)

    const [[batched]] = spies.callBatchMethod.mock.calls
    expect(batched).toContain('dispatchAs(Alice)->ORIG_TX')
    expect(batched.join('|')).not.toMatch(/USDT/)
  })

  it('mintFeeAssets=false skips native/relay/fee mints and only mints main asset + dispatches original tx', async () => {
    const { api, spies } = mkApi()
    const chain = 'Acala'
    const address = 'Alice'
    const originalTx = 'ORIG_TX'

    const nativeAsset = {
      symbol: 'ACA',
      decimals: 12,
      isNative: true,
      location: { parents: 1, interior: { X1: [{ Parachain: 2000 }] } }
    } as TAssetInfo
    const mainAsset = {
      symbol: 'USDT',
      decimals: 6,
      assetId: undefined,
      amount: 7n
    } as WithAmount<TAssetInfo>

    spies.findNativeAssetInfo.mockReturnValue(nativeAsset)
    spies.findNativeAssetInfoOrThrow.mockReturnValue(nativeAsset)
    spies.findAssetInfo.mockReturnValue({
      symbol: 'RelayDOT',
      decimals: 10
    } as TAssetInfo)

    const result = await wrapTxBypass(
      {
        api,
        chain,
        address,
        version,
        asset: mainAsset,
        feeAsset: { symbol: 'USDC', decimals: 6 } as TAssetInfo,
        tx: originalTx
      },
      { mintFeeAssets: false, sentAssetMintMode: 'bypass' }
    )
    expect(result).toBeDefined()

    const [[batched]] = spies.callBatchMethod.mock.calls
    expect(batched.join('|')).not.toMatch(/set_balance:ACA/)
    expect(batched.join('|')).not.toMatch(/RelayDOT/)
    expect(batched.join('|')).not.toMatch(/USDC/)

    expect(batched).toEqual([
      'call:Mint:status:USDT',
      'dispatchAs(Alice)->call:Mint:set_balance:USDT',
      'dispatchAs(Alice)->ORIG_TX'
    ])
  })

  it('does not mint relay twice when relay equals native (dedupe) and still mints main asset', async () => {
    const { api, spies } = mkApi()
    const chain = 'Acala'
    const address = 'Alice'
    const originalTx = 'ORIG_TX'

    const nativeRelay = { symbol: 'ACA', decimals: 12, isNative: true } as TAssetInfo
    const mainAsset = {
      symbol: 'USDT',
      decimals: 6,
      assetId: undefined,
      amount: 1000n
    } as WithAmount<TAssetInfo>

    spies.findNativeAssetInfo.mockReturnValue(nativeRelay)
    spies.findNativeAssetInfoOrThrow.mockReturnValue(nativeRelay)
    spies.findAssetInfo.mockReturnValue(nativeRelay)

    const res = await wrapTxBypass({
      api,
      chain,
      address,
      version,
      asset: mainAsset,
      tx: originalTx
    })
    expect(res).toBeDefined()

    const [[batched]] = spies.callBatchMethod.mock.calls
    const nativeMints = batched.filter(x => String(x) === 'call:Mint:set_balance:ACA')
    expect(nativeMints.length).toBe(1)

    expect(batched.join('|')).toMatch(/Mint:status:USDT/)
  })

  it('preview mode adds +1000 bonus when the sent asset equals the pre-minted native asset', async () => {
    const { api, spies } = mkApi()
    const chain = 'Acala'
    const address = 'Alice'
    const originalTx = 'ORIG_TX'

    const nativeAsset = { symbol: 'ACA', isNative: true, decimals: 12 } as TAssetInfo
    const mainAssetIsNative = {
      symbol: 'ACA',
      isNative: true,
      decimals: 12,
      amount: 5n
    } as WithAmount<TAssetInfo>

    spies.findNativeAssetInfo.mockReturnValue(nativeAsset)
    spies.findNativeAssetInfoOrThrow.mockReturnValue(nativeAsset)
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(0n)

    spies.findAssetInfo.mockImplementation(() => nativeAsset)

    const res = await wrapTxBypass(
      { api, chain, address, version, asset: mainAssetIsNative, tx: originalTx },
      { mintFeeAssets: true, sentAssetMintMode: 'preview' }
    )
    expect(res).toBeDefined()

    const [[batched]] = spies.callBatchMethod.mock.calls
    const acaMints = batched.filter(x => String(x) === 'call:Mint:set_balance:ACA')
    expect(acaMints.length).toBeGreaterThanOrEqual(2)
    expect(batched).toContain('dispatchAs(Alice)->ORIG_TX')
  })
})

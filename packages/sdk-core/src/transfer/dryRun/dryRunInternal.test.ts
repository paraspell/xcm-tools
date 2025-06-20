import type { TAsset } from '@paraspell/assets'
import { findAssetForNodeOrThrow, getNativeAssetSymbol, hasDryRunSupport } from '@paraspell/assets'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { getTNode } from '../../nodes/getTNode'
import type { TDryRunOptions } from '../../types'
import { determineRelayChain } from '../../utils'
import { dryRunInternal } from './dryRunInternal'

vi.mock('@paraspell/assets', () => ({
  findAssetForNodeOrThrow: vi.fn(),
  getNativeAssetSymbol: vi.fn(),
  hasDryRunSupport: vi.fn()
}))

vi.mock('@paraspell/sdk-common', async importOriginal => ({
  ...(await importOriginal<typeof import('@paraspell/sdk-common')>()),
  isRelayChain: vi.fn().mockReturnValue(false)
}))

vi.mock('../../nodes/getTNode', () => ({
  getTNode: vi.fn()
}))

vi.mock('../../utils', () => ({
  determineRelayChain: vi.fn(),
  addXcmVersionHeader: vi.fn().mockReturnValue({})
}))

vi.mock('../fees/getFeeForDestNode', () => ({
  createOriginLocation: () => ({})
}))

const createFakeApi = (originDryRun: unknown, xcmResults: unknown[] = []) => {
  const hopResults = [...xcmResults]

  return {
    setDisconnectAllowed: vi.fn(),
    disconnect: vi.fn().mockResolvedValue(undefined),
    getApi: vi.fn().mockReturnValue({ disconnect: vi.fn() }),
    getDryRunCall: vi.fn().mockResolvedValue(originDryRun),
    clone: vi.fn().mockImplementation(() => ({
      init: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      getApi: vi.fn().mockReturnValue({}),
      getDryRunXcm: vi.fn().mockResolvedValue(hopResults.shift())
    }))
  } as unknown as IPolkadotApi<unknown, unknown>
}

const emptyXcms = [null, [{ value: [1] }]]

const createOptions = (api: IPolkadotApi<unknown, unknown>) =>
  ({
    api,
    tx: {} as unknown,
    origin: 'Acala',
    destination: 'Moonbeam',
    senderAddress: '5Alice',
    currency: { symbol: 'ACA', amount: 1_000n }
  }) as unknown as TDryRunOptions<unknown, unknown>

afterEach(() => vi.resetAllMocks())

describe('dryRunInternal', () => {
  it('returns only origin result when origin dry-run fails', async () => {
    vi.mocked(findAssetForNodeOrThrow).mockReturnValue({ symbol: 'ACA' } as TAsset)

    const originFail = { success: false, failureReason: 'someError' }
    const api = createFakeApi(originFail)

    const res = await dryRunInternal(createOptions(api))

    expect(res).toEqual({
      failureReason: 'someError',
      failureChain: 'origin',
      origin: originFail,
      hops: []
    })
  })

  it('origin & destination succeed (no intermediates)', async () => {
    vi.mocked(findAssetForNodeOrThrow).mockReturnValue({ symbol: 'ACA' } as TAsset)
    vi.mocked(getNativeAssetSymbol).mockReturnValueOnce('ACA').mockReturnValueOnce('GLMR')
    vi.mocked(getTNode).mockReturnValue('Moonbeam')
    vi.mocked(hasDryRunSupport).mockReturnValue(true)

    const originOk = {
      success: true,
      fee: 1_000n,
      forwardedXcms: emptyXcms,
      destParaId: 2000
    }
    const destOk = {
      success: true,
      fee: 2_000n,
      forwardedXcms: undefined,
      destParaId: undefined
    }

    const api = createFakeApi(originOk, [destOk])

    const res = await dryRunInternal(createOptions(api))

    expect(res).toEqual({
      origin: { ...originOk, currency: 'ACA' },
      destination: { ...destOk, currency: 'ACA' },
      hops: []
    })
  })

  it('adds intermediate AssetHub result when hop succeeds', async () => {
    vi.mocked(findAssetForNodeOrThrow).mockReturnValue({ symbol: 'ACA' } as TAsset)
    vi.mocked(getNativeAssetSymbol).mockImplementation(node => {
      if (node === 'AssetHubPolkadot') return 'DOT'
      if (node === 'Moonbeam') return 'GLMR'
      return 'ACA'
    })

    vi.mocked(determineRelayChain).mockReturnValue('Polkadot')
    vi.mocked(getTNode)
      .mockImplementationOnce(() => 'AssetHubPolkadot')
      .mockImplementationOnce(() => 'Moonbeam')

    vi.mocked(hasDryRunSupport).mockReturnValue(true)

    const originOk = {
      success: true,
      fee: 1_000n,
      forwardedXcms: emptyXcms,
      destParaId: 1000
    }
    const assetHubOk = {
      success: true,
      fee: 3_000n,
      forwardedXcms: emptyXcms,
      destParaId: 2000
    }
    const destOk = {
      success: true,
      fee: 4_000n,
      forwardedXcms: undefined,
      destParaId: undefined
    }

    const api = createFakeApi(originOk, [assetHubOk, destOk])

    const res = await dryRunInternal(createOptions(api))

    expect(res).toEqual({
      origin: { ...originOk, currency: 'ACA' },
      assetHub: { ...assetHubOk, currency: 'DOT' },
      destination: { ...destOk, currency: 'ACA' },
      hops: [{ chain: 'AssetHubPolkadot', result: { ...assetHubOk, currency: 'DOT' } }]
    })
  })

  it('keeps failing destination result when last hop errors', async () => {
    vi.mocked(findAssetForNodeOrThrow).mockReturnValue({ symbol: 'ACA' } as TAsset)
    vi.mocked(getNativeAssetSymbol).mockReturnValueOnce('ACA')
    vi.mocked(hasDryRunSupport).mockReturnValue(true)
    vi.mocked(getTNode).mockReturnValue('Moonbeam')

    const originOk = {
      success: true,
      fee: 1_000n,
      forwardedXcms: emptyXcms,
      destParaId: 2000
    }
    const destFail = { success: false, failureReason: 'dest-boom' }

    const api = createFakeApi(originOk, [destFail])

    const res = await dryRunInternal(createOptions(api))

    expect(res).toEqual({
      failureReason: 'dest-boom',
      failureChain: 'destination',
      origin: { ...originOk, currency: 'ACA' },
      destination: destFail,
      hops: []
    })
  })
})

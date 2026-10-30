import {
  InvalidCurrencyError,
  type TAssetInfo,
  type TAssetWithFee,
  type TCurrencyInput
} from '@paraspell/assets'
import type { TChain, TLocation } from '@paraspell/sdk-common'
import { deepEqual } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RELAY_LOCATION } from '../../constants'
import type { TAddress, TResolveEdDepositOptions } from '../../types'
import { isAssetSufficient } from './isAssetSufficient'
import { resolveEdDeposit } from './resolveEdDeposit'

vi.mock('./isAssetSufficient')

const createAssetLocation = (generalIndex: number): TLocation => ({
  parents: 1,
  interior: { X3: [{ Parachain: 1000 }, { PalletInstance: 50 }, { GeneralIndex: generalIndex }] }
})

const nativeAsset = {
  symbol: 'DOT',
  decimals: 10,
  location: RELAY_LOCATION,
  existentialDeposit: '100000000',
  isNative: true
} as TAssetInfo

const usdt = {
  symbol: 'USDT',
  decimals: 6,
  location: createAssetLocation(1984),
  existentialDeposit: '10000'
} as TAssetInfo

const pink = {
  symbol: 'PINK',
  decimals: 10,
  location: createAssetLocation(23),
  existentialDeposit: '1'
} as TAssetInfo

const unknownLocation = createAssetLocation(404)

const createOverriddenAsset = (location: TLocation, isFeeAsset = false): TAssetWithFee => ({
  id: location,
  fun: { Fungible: 1000n },
  isFeeAsset
})

describe('resolveEdDeposit', () => {
  const originApi = {
    findAssetOnDestOrThrow: vi.fn(),
    localizeLocation: vi.fn()
  }

  const destApi = {
    queryState: vi.fn(),
    queryRuntimeApi: vi.fn(),
    findNativeAssetInfoOrThrow: vi.fn()
  }

  const createOptions = ({
    destChain = 'AssetHubPolkadot',
    feeAssetLocation = RELAY_LOCATION,
    recipient = '5Recipient',
    overriddenAsset
  }: {
    destChain?: TChain
    feeAssetLocation?: TLocation
    recipient?: TAddress
    overriddenAsset?: TAssetWithFee[]
  } = {}) =>
    ({
      origin: { api: originApi, chain: 'Hydration' },
      dest: { api: destApi, chain: destChain },
      assetInfo: pink,
      overriddenAsset,
      feeAssetLocation,
      recipient
    }) as unknown as TResolveEdDepositOptions<unknown, unknown, unknown>

  beforeEach(() => {
    originApi.localizeLocation.mockImplementation((_chain: TChain, location: TLocation) => location)
    originApi.findAssetOnDestOrThrow.mockImplementation(
      (_origin: TChain, destination: TChain, currency: TCurrencyInput) => {
        const found = [usdt, pink].find(
          asset => 'location' in currency && deepEqual(asset.location, currency.location)
        )
        if (!found) throw new InvalidCurrencyError(`Asset not found on ${destination}`)
        return found
      }
    )
    destApi.queryState.mockResolvedValue({ providers: 0 })
    destApi.findNativeAssetInfoOrThrow.mockReturnValue(nativeAsset)
    vi.mocked(isAssetSufficient).mockImplementation((_api, _chain, asset) =>
      Promise.resolve(asset !== pink)
    )
  })

  it('returns undefined for external destinations', async () => {
    await expect(
      resolveEdDeposit(createOptions({ destChain: 'Ethereum' }))
    ).resolves.toBeUndefined()
    expect(destApi.queryState).not.toHaveBeenCalled()
  })

  it('returns undefined when the recipient is a location', async () => {
    const recipient: TLocation = { parents: 0, interior: { Here: null } }

    await expect(resolveEdDeposit(createOptions({ recipient }))).resolves.toBeUndefined()
    expect(destApi.queryState).not.toHaveBeenCalled()
  })

  it('returns undefined when the recipient account already has a provider', async () => {
    destApi.queryState.mockResolvedValue({ providers: 1 })

    await expect(resolveEdDeposit(createOptions())).resolves.toBeUndefined()
    expect(destApi.queryState).toHaveBeenCalledWith({
      module: 'System',
      method: 'Account',
      params: ['5Recipient']
    })
    expect(isAssetSufficient).not.toHaveBeenCalled()
  })

  it('returns undefined when the transferred asset is sufficient', async () => {
    vi.mocked(isAssetSufficient).mockResolvedValue(true)

    await expect(resolveEdDeposit(createOptions())).resolves.toBeUndefined()
    expect(isAssetSufficient).toHaveBeenCalledWith(destApi, 'AssetHubPolkadot', pink)
  })

  it('returns the native ED when the fee asset is the destination native asset', async () => {
    await expect(resolveEdDeposit(createOptions())).resolves.toBe(100000000n)
    expect(destApi.queryRuntimeApi).not.toHaveBeenCalled()
  })

  it('checks the fee asset of a currency array too', async () => {
    const overriddenAsset = [
      createOverriddenAsset(usdt.location),
      createOverriddenAsset(pink.location, true)
    ]
    destApi.queryRuntimeApi.mockResolvedValue(1000)

    await expect(
      resolveEdDeposit(createOptions({ overriddenAsset, feeAssetLocation: pink.location }))
    ).resolves.toBe(1300n)
    expect(isAssetSufficient).toHaveBeenCalledWith(destApi, 'AssetHubPolkadot', usdt)
    expect(isAssetSufficient).toHaveBeenCalledWith(destApi, 'AssetHubPolkadot', pink)
  })

  it('throws when an asset is not found on destination', async () => {
    const overriddenAsset = [
      createOverriddenAsset(unknownLocation),
      createOverriddenAsset(usdt.location, true)
    ]

    await expect(resolveEdDeposit(createOptions({ overriddenAsset }))).rejects.toThrow(
      InvalidCurrencyError
    )
    expect(isAssetSufficient).not.toHaveBeenCalled()
  })

  it('returns undefined for a non-native fee asset outside AssetHub', async () => {
    await expect(
      resolveEdDeposit(createOptions({ destChain: 'Jamton', feeAssetLocation: usdt.location }))
    ).resolves.toBeUndefined()
    expect(destApi.queryState).not.toHaveBeenCalled()
    expect(isAssetSufficient).not.toHaveBeenCalled()
    expect(destApi.queryRuntimeApi).not.toHaveBeenCalled()
  })

  it('quotes the padded fee asset amount for the native ED on AssetHub', async () => {
    destApi.queryRuntimeApi.mockResolvedValue(1000)

    await expect(
      resolveEdDeposit(createOptions({ feeAssetLocation: usdt.location }))
    ).resolves.toBe(1300n)
    expect(destApi.queryRuntimeApi).toHaveBeenCalledWith({
      module: 'AssetConversionApi',
      method: 'quote_price_tokens_for_exact_tokens',
      params: [usdt.location, RELAY_LOCATION, 100000000n, true]
    })
  })

  it.each([null, undefined])(
    'returns undefined when the fee asset has no AssetHub quote (%s)',
    async quote => {
      destApi.queryRuntimeApi.mockResolvedValue(quote)

      await expect(
        resolveEdDeposit(createOptions({ feeAssetLocation: usdt.location }))
      ).resolves.toBeUndefined()
    }
  )
})

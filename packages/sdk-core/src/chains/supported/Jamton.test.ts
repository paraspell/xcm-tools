import { hexToBytes } from '@noble/hashes/utils.js'
import type { TAssetInfo, WithAmount } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type {
  TPolkadotXCMTransferOptions,
  TSerializedExtrinsics,
  TTransferLocalOptions
} from '../../types'
import { getChain } from '../../utils/getChain'
import { getLocalTransferAmount } from '../../utils/transfer'
import SubstrateChain from '../SubstrateChain'
import type Jamton from './Jamton'

vi.mock('../../pallets/polkadotXcm')
vi.mock('../../utils/transfer')

describe('Jamton', () => {
  let chain: Jamton<unknown, unknown, unknown>

  const baseInput = {
    assetInfo: {},
    scenario: 'ParaToPara' as const,
    destination: 'AssetHubPolkadot' as const,
    version: Version.V4
  } as TPolkadotXCMTransferOptions<unknown, unknown, unknown>

  const usdtAsset: TAssetInfo = {
    symbol: 'USDT',
    assetId: '123',
    decimals: 6,
    existentialDeposit: '1000',
    location: {
      parents: 1,
      interior: {
        X1: [{ Parachain: 1000 }]
      }
    }
  }

  beforeEach(() => {
    vi.resetAllMocks()
    chain = getChain<unknown, unknown, unknown, 'Jamton'>('Jamton')
  })

  describe('initialization', () => {
    it('should initialize with correct values', () => {
      expect(chain.chain).toBe('Jamton')
      expect(chain.info).toBe('jamton')
      expect(chain.ecosystem).toBe('Polkadot')
      expect(chain.version).toBe(Version.V4)
    })
  })

  it('uses custom currency IDs for minting', () => {
    expect(chain['getMintConfig']()).toEqual({ useCustomCurrencyId: true })
  })

  it('uses the custom currency ID for local transfers', () => {
    const api = {} as PolkadotApi<unknown, unknown, unknown>
    expect(chain['getLocalCurrencyId'](api, usdtAsset)).toEqual({ ForeignAsset: 123 })
  })

  it('should handle native asset', async () => {
    const input = {
      ...baseInput,
      assetInfo: { symbol: 'DOTON', isNative: true, amount: 100n }
    } as TPolkadotXCMTransferOptions<unknown, unknown, unknown>

    await chain.transferPolkadotXCM(input)

    expect(transferPolkadotXcm).toHaveBeenCalledWith(input)
  })

  it('should handle foreign asset', async () => {
    const input = {
      ...baseInput,
      assetInfo: { ...usdtAsset, amount: 100n }
    }
    await chain.transferPolkadotXCM(input)

    expect(transferPolkadotXcm).toHaveBeenCalledWith(input)
  })

  it('should throw ScenarioNotSupportedError for ParaToPara to non-AssetHubPolkadot', () => {
    const input = {
      ...baseInput,
      assetInfo: { ...usdtAsset, amount: 100n },
      scenario: 'ParaToPara' as const,
      destination: 'Acala' as const
    }
    expect(() => chain.transferPolkadotXCM(input)).toThrow(ScenarioNotSupportedError)
    expect(() => chain.transferPolkadotXCM(input)).toThrow(
      'Transfer from Jamton to "Acala" is not yet supported'
    )
  })

  it('should allow ParaToPara to AssetHubPolkadot', async () => {
    const input = {
      ...baseInput,
      assetInfo: { ...usdtAsset, amount: 100n },
      scenario: 'ParaToPara' as const,
      destination: 'AssetHubPolkadot' as const
    }
    await chain.transferPolkadotXCM(input)

    expect(transferPolkadotXcm).toHaveBeenCalledWith(input)
  })

  it('should allow non-ParaToPara scenarios to any destination', async () => {
    const input = {
      ...baseInput,
      assetInfo: { ...usdtAsset, amount: 100n },
      scenario: 'ParaToRelay' as const,
      destination: 'Acala' as const
    }
    await chain.transferPolkadotXCM(input)

    expect(transferPolkadotXcm).toHaveBeenCalledWith(input)
  })

  it.each([
    ['WUD', 31337],
    ['PINK', 23]
  ])('uses the normal transfer path for %s by location', async (symbol, generalIndex) => {
    const input = {
      ...baseInput,
      assetInfo: {
        symbol,
        amount: 1000n,
        location: {
          parents: 1,
          interior: {
            X3: [{ Parachain: 1000 }, { PalletInstance: 50 }, { GeneralIndex: generalIndex }]
          }
        }
      }
    } as TPolkadotXCMTransferOptions<unknown, unknown, unknown>

    await chain.transferPolkadotXCM(input)

    expect(transferPolkadotXcm).toHaveBeenCalledWith(input)
  })

  describe('XAUH', () => {
    const address = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'

    const xauh: WithAmount<TAssetInfo> = {
      symbol: 'XAUH',
      assetId: '3',
      decimals: 18,
      existentialDeposit: '0',
      isNative: true,
      location: {
        parents: 1,
        interior: {
          X2: [
            { Parachain: 3397 },
            {
              GeneralKey: {
                length: 32,
                data: '0x0000000000000000000000000000000000000000000000000000000078617568'
              }
            }
          ]
        }
      },
      amount: 1000n
    }

    const doton: WithAmount<TAssetInfo> = {
      symbol: 'DOTON',
      assetId: '0',
      decimals: 18,
      existentialDeposit: '1000000000000000',
      isNative: true,
      location: { parents: 1, interior: { X1: [{ Parachain: 3397 }] } },
      amount: 1000n
    }

    const findNativeAssetInfoOrThrow = vi.fn()

    beforeEach(() => {
      findNativeAssetInfoOrThrow.mockReturnValue(doton)
    })

    const foreignAsset: WithAmount<TAssetInfo> = { ...usdtAsset, amount: 1000n }

    it('transfers locally via Currencies.transfer', () => {
      const deserializeExtrinsics = vi.fn()
      const api = { deserializeExtrinsics, findNativeAssetInfoOrThrow } as unknown as PolkadotApi<
        unknown,
        unknown,
        unknown
      >
      vi.mocked(getLocalTransferAmount).mockReturnValue(1000n)

      chain.transferLocalNonNativeAsset({
        api,
        assetInfo: xauh,
        recipient: address,
        balance: 0n
      } as TTransferLocalOptions<unknown, unknown, unknown>)

      expect(deserializeExtrinsics).toHaveBeenCalledWith({
        module: 'Currencies',
        method: 'transfer',
        params: {
          dest: { Id: address },
          currency_id: { Native: 3 },
          amount: 1000n
        }
      })
    })

    it('uses the default local transfer for foreign assets', () => {
      const superTransfer = vi
        .spyOn(SubstrateChain.prototype, 'transferLocalNonNativeAsset')
        .mockReturnValue('tx')
      const options = {
        api: {},
        assetInfo: foreignAsset,
        recipient: address
      } as TTransferLocalOptions<unknown, unknown, unknown>

      expect(chain.transferLocalNonNativeAsset(options)).toBe('tx')
      expect(superTransfer).toHaveBeenCalledWith(options)
    })

    it('queries the balance via the Currencies runtime api', async () => {
      const queryRuntimeApi = vi.fn().mockResolvedValue('0x2a')
      const api = { queryRuntimeApi, findNativeAssetInfoOrThrow } as unknown as PolkadotApi<
        unknown,
        unknown,
        unknown
      >

      const balance = await chain.getBalanceForeign(api, address, xauh)

      expect(queryRuntimeApi).toHaveBeenCalledWith({
        module: 'Currencies',
        method: 'free_balance',
        params: [{ Native: 3 }, address]
      })
      expect(balance).toBe(42n)
    })

    it('uses the default balance query for foreign assets', async () => {
      const superBalance = vi
        .spyOn(SubstrateChain.prototype, 'getBalanceForeign')
        .mockResolvedValue(5n)
      const api = {} as PolkadotApi<unknown, unknown, unknown>

      expect(await chain.getBalanceForeign(api, address, usdtAsset)).toBe(5n)
      expect(superBalance).toHaveBeenCalledWith(api, address, usdtAsset)
    })

    it('mints by setting HerculisGold balance storage', async () => {
      const accountToUint8a = vi
        .fn()
        .mockReturnValue(
          hexToBytes('d43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d')
        )
      const api = { accountToUint8a, findNativeAssetInfoOrThrow } as unknown as PolkadotApi<
        unknown,
        unknown,
        unknown
      >

      const res = await chain.mint(api, address, xauh, 500n)

      expect(accountToUint8a).toHaveBeenCalledWith(address)
      expect(res).toEqual({
        balanceTx: {
          module: 'System',
          method: 'set_storage',
          params: {
            items: [
              [
                '0xb5288313a908b05b8e6dc4c999b69de9c2261276cc9d1f8598ea4b6a74b15c2fde1e86a9a8c739864cf3cc5ec2bea59fd43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d',
                '0xdc050000000000000000000000000000'
              ]
            ]
          }
        }
      })
    })

    it.each([
      ['the main native asset', doton],
      ['foreign assets', foreignAsset]
    ])('uses the default mint for %s', async (_, asset) => {
      const balanceTx: TSerializedExtrinsics = {
        module: 'Currencies',
        method: 'update_balance',
        params: {}
      }
      const superMint = vi.spyOn(SubstrateChain.prototype, 'mint').mockResolvedValue({ balanceTx })
      const api = { findNativeAssetInfoOrThrow } as unknown as PolkadotApi<
        unknown,
        unknown,
        unknown
      >

      const res = await chain.mint(api, address, asset, 0n)

      expect(superMint).toHaveBeenCalledWith(api, address, asset, 0n)
      expect(res).toEqual({ balanceTx })
    })
  })
})

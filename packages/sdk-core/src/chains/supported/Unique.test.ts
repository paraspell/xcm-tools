import { hexToBytes } from '@noble/hashes/utils.js'
import type { TAssetInfo, WithAmount } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type {
  TPolkadotXCMTransferOptions,
  TSerializedExtrinsics,
  TTransferLocalOptions
} from '../../types'
import { getChain } from '../../utils/getChain'
import { getLocalTransferAmount } from '../../utils/transfer'
import SubstrateChain from '../SubstrateChain'
import type Unique from './Unique'

vi.mock('../../pallets/polkadotXcm')
vi.mock('../../utils/transfer')

describe('Unique', () => {
  let chain: Unique<unknown, unknown, unknown>

  const mockInput = {
    assetInfo: { symbol: 'GLMR', assetId: '123', amount: 100n }
  } as TPolkadotXCMTransferOptions<unknown, unknown, unknown>

  beforeEach(() => {
    chain = getChain<unknown, unknown, unknown, 'Unique'>('Unique')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('Unique')
    expect(chain.info).toBe('unique')
    expect(chain.ecosystem).toBe('Polkadot')
    expect(chain.version).toBe(Version.V5)
  })

  it('should create typeAndThen call when transferPolkadotXcm is invoked', async () => {
    await chain.transferPolkadotXCM(mockInput)
    expect(transferPolkadotXcm).toHaveBeenCalledWith(mockInput)
  })

  it('should build a unique.transfer call for local foreign asset transfers', () => {
    const deserializeExtrinsics = vi.fn()
    const api = { deserializeExtrinsics } as unknown as PolkadotApi<unknown, unknown, unknown>

    const input = {
      api,
      assetInfo: { symbol: 'DOT', assetId: '437', amount: 100n },
      recipient: 'address',
      balance: 1000n
    } as TTransferLocalOptions<unknown, unknown, unknown>

    vi.mocked(getLocalTransferAmount).mockReturnValue(100n)

    chain.transferLocalNonNativeAsset(input)

    expect(deserializeExtrinsics).toHaveBeenCalledWith({
      module: 'Unique',
      method: 'transfer',
      params: {
        recipient: { Substrate: 'address' },
        collection_id: 437,
        item_id: 0,
        value: 100n
      }
    })
  })

  describe('getBalanceForeign', () => {
    const address = '5FbalanceAddr'
    const asset: TAssetInfo = {
      symbol: 'QTZ',
      decimals: 12,
      existentialDeposit: '1000',
      assetId: '42',
      location: { parents: 1, interior: { X1: [{ Parachain: 2037 }] } }
    }

    it('should query UniqueApi.balance with the collection id and item id 0', async () => {
      const queryRuntimeApi = vi.fn().mockResolvedValue({ success: true, value: 500n, ok: 300n })

      const api = { queryRuntimeApi } as unknown as PolkadotApi<unknown, unknown, unknown>

      const balance = await chain.getBalanceForeign(api, address, asset)

      expect(queryRuntimeApi).toHaveBeenCalledWith({
        module: 'UniqueApi',
        method: 'balance',
        params: [42, { Substrate: address }, 0]
      })
      expect(balance).toBe(500n)
    })
  })

  describe('mint', () => {
    const address = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'

    const asset: WithAmount<TAssetInfo> = {
      symbol: 'DOT',
      decimals: 10,
      existentialDeposit: '0',
      assetId: '437',
      location: { parents: 1, interior: { Here: null } },
      amount: 1000n
    }

    const xxhashAsHex = vi.fn().mockReturnValue('0xeda8e3819b2f64f8')
    const accountToUint8a = vi
      .fn()
      .mockReturnValue(
        hexToBytes('d43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d')
      )

    const api = { xxhashAsHex, accountToUint8a } as unknown as PolkadotApi<
      unknown,
      unknown,
      unknown
    >

    it('mints foreign assets by setting Fungible balance and total supply storage', async () => {
      const res = await chain.mint(api, address, asset, 500n)

      expect(xxhashAsHex).toHaveBeenCalledWith(new Uint8Array([0xb5, 0x01, 0x00, 0x00]))
      expect(accountToUint8a).toHaveBeenCalledWith(address)
      expect(res).toEqual({
        balanceTx: {
          module: 'System',
          method: 'set_storage',
          params: {
            items: [
              [
                '0xb6f8df5e96e2c932e9bd00274d53a26f4ea8ea0c01faa42b6eb344a85c47b387eda8e3819b2f64f8b5010000ff699fe6ae26ef97168ddeaecbc34ce300d43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d',
                '0xdc050000000000000000000000000000'
              ],
              [
                '0xb6f8df5e96e2c932e9bd00274d53a26f5994cfda14cd67e1586647d40008abaaeda8e3819b2f64f8b5010000',
                '0xdc050000000000000000000000000000'
              ]
            ]
          }
        }
      })
    })

    it('uses the default mint for the native asset', async () => {
      const nativeAsset: WithAmount<TAssetInfo> = {
        symbol: 'UNQ',
        decimals: 18,
        existentialDeposit: '0',
        isNative: true,
        location: { parents: 1, interior: { X1: [{ Parachain: 2037 }] } },
        amount: 1000n
      }
      const balanceTx: TSerializedExtrinsics = {
        module: 'Balances',
        method: 'force_set_balance',
        params: {}
      }
      const superMint = vi.spyOn(SubstrateChain.prototype, 'mint').mockResolvedValue({ balanceTx })

      const res = await chain.mint(api, address, nativeAsset, 0n)

      expect(superMint).toHaveBeenCalledWith(api, address, nativeAsset, 0n)
      expect(res).toEqual({ balanceTx })
    })
  })
})

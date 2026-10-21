import type { TAssetInfo } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
import { getAssetBalanceInternal } from '../../balance'
import { SystemPallet } from '../../pallets/system/SystemPallet'
import type { TGetTransferableAmountOptions, TXcmFeeDetail } from '../../types'
import { abstractDecimals } from '../../utils'
import { getOriginXcmFee } from '../fees'
import { getTransferableAmount } from './getTransferableAmount'

vi.mock('../../balance')
vi.mock('../../utils')
vi.mock('../fees')

// Regression test for #2176: native balances already come from
// SystemPallet.getBalance, which excludes the existential deposit
// (spendable = free - max(frozen - reserved, ED)). The ED must therefore not
// be subtracted a second time in computeTransferableAmount.
it('reserves the native existential deposit only once', async () => {
  const asset = {
    symbol: 'DOT',
    decimals: 10,
    existentialDeposit: '100',
    isNative: true,
    location: { parents: 1, interior: { Here: null } }
  } as TAssetInfo
  const api = {
    queryState: vi
      .fn()
      .mockResolvedValue({ data: { free: 1000n, reserved: 0n, frozen: 0n } }),
    findAssetInfoOrThrow: vi.fn().mockReturnValue(asset),
    findNativeAssetInfoOrThrow: vi.fn().mockReturnValue(asset),
    disconnect: vi.fn().mockResolvedValue(undefined)
  } as unknown as PolkadotApi<unknown, unknown, unknown>

  vi.mocked(abstractDecimals).mockImplementation(amount => BigInt(amount))
  vi.mocked(getAssetBalanceInternal).mockImplementation(() =>
    new SystemPallet('System').getBalance(api, 'validAddress', asset)
  )
  vi.mocked(getOriginXcmFee).mockResolvedValue({ fee: 200n, asset } as TXcmFeeDetail)

  const options = {
    api,
    sender: 'validAddress',
    origin: 'Polkadot',
    destination: 'AssetHubPolkadot',
    currency: { symbol: 'DOT', amount: 1000n },
    version: Version.V5,
    // eslint-disable-next-line @typescript-eslint/require-await
    buildTx: vi.fn(async () => ({}))
  } as TGetTransferableAmountOptions<unknown, unknown, unknown>

  // spendable 1000 (free 1000, ED already reserved inside SystemPallet)
  // minus origin fee 200 should leave 700 - and not 600 - as before.
  await expect(getTransferableAmount(options)).resolves.toBe(700n)
})

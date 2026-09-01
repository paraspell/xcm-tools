import { blake2b } from '@noble/hashes/blake2.js'
import { keccak_256 } from '@noble/hashes/sha3.js'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js'
import type { TAssetInfo, TErc20Info } from '@paraspell/assets'
import { InvalidCurrencyError } from '@paraspell/assets'
import type { TJunctionAccountKey20 } from '@paraspell/sdk-common'
import { getJunctionValue } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../../api'
import type { TSetBalanceRes } from '../../types/TAssets'

// twox128("EVM") ++ twox128("AccountStorages") — the pallet_evm::AccountStorages storage prefix.
const ACCOUNT_STORAGES_PREFIX = '1da53b775b270400e7e61ed5cbc5a146ab1160471b1418779239ba8e2b847e42'

// "ETH\0" — prefix of account ids that Hydration derives from an EVM address
const EVM_ACCOUNT_PREFIX = '45544800'

const word = (hex: string) => hex.padStart(64, '0')

const blake2128Concat = (hex: string) => bytesToHex(blake2b(hexToBytes(hex), { dkLen: 16 })) + hex

// Mirrors pallet_evm_accounts::evm_address
const toEvmAddress = (accountId: string) =>
  accountId.startsWith(EVM_ACCOUNT_PREFIX) && accountId.endsWith('0'.repeat(16))
    ? accountId.slice(8, 48)
    : accountId.slice(0, 40)

export const buildErc20StorageMint = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
  address: string,
  asset: TAssetInfo,
  erc20: TErc20Info,
  balance: bigint
): TSetBalanceRes => {
  const contract =
    erc20.contract ??
    getJunctionValue<TJunctionAccountKey20['AccountKey20']>(asset.location, 'AccountKey20')?.key
  if (!contract) throw new InvalidCurrencyError(`Missing ERC20 contract for asset ${asset.symbol}`)

  const evmAddress = toEvmAddress(bytesToHex(api.accountToUint8a(address)))
  const slotKey = bytesToHex(
    keccak_256(hexToBytes(word(evmAddress) + word(erc20.balanceSlot.toString(16))))
  )

  return {
    balanceTx: {
      module: 'System',
      method: 'set_storage',
      params: {
        items: [
          [
            '0x' +
              ACCOUNT_STORAGES_PREFIX +
              blake2128Concat(contract.slice(2)) +
              blake2128Concat(slotKey),
            '0x' + word(balance.toString(16))
          ]
        ]
      }
    }
  }
}

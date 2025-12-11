import { blake2b } from '@noble/hashes/blake2.js'
import { getAssetsObject, isChainEvm } from '@paraspell/assets'
import type { TSubstrateChain } from '@paraspell/sdk-common'
import { base58 } from '@scure/base'
import { isAddress } from 'viem'

import type { IPolkadotApi } from '../api'
import { InvalidAddressError } from '../errors'

// Inspired by Talisman Society’s SS58 encoder:
// https://github.com/TalismanSociety/talisman/blob/dev/packages/crypto/src/address/encoding/ss58.ts

export const blake2b256 = (msg: Uint8Array) => blake2b(msg, { dkLen: 32 })
export const blake2b512 = (msg: Uint8Array) => blake2b(msg, { dkLen: 64 })

const ALLOWED_PUBKEY_BYTES = new Set([32, 33])

export const deriveAccountId = (raw: Uint8Array): Uint8Array => {
  if (!ALLOWED_PUBKEY_BYTES.has(raw.length)) {
    throw new InvalidAddressError('public key length is invalid')
  }
  return raw.length === 33 ? blake2b256(raw) : raw
}

const SS58_HARD_PREFIX = new TextEncoder().encode('SS58PRE')
const CHECKSUM_BYTES = 2
const VALID_ADDR_PAYLOAD = new Set([32, 33])

const networkToBytes = (net: number): Uint8Array => {
  if (net < 64) {
    return Uint8Array.of(net)
  }
  // Two-byte form: see https://docs.substrate.io/reference/address-formats/
  const first = ((net >> 2) & 0b0011_1111) | 0b0100_0000
  const second = ((net >> 8) & 0xff) | ((net & 0b0000_0011) << 6)
  return Uint8Array.of(first, second)
}

export const encodeSs58 = (payload: Uint8Array, network: number): string => {
  if (!VALID_ADDR_PAYLOAD.has(payload.length)) {
    throw new InvalidAddressError('unexpected payload length for SS58 address')
  }

  const netBytes = networkToBytes(network)

  const chkInput = new Uint8Array(SS58_HARD_PREFIX.length + netBytes.length + payload.length)
  chkInput.set(SS58_HARD_PREFIX, 0)
  chkInput.set(netBytes, SS58_HARD_PREFIX.length)
  chkInput.set(payload, SS58_HARD_PREFIX.length + netBytes.length)

  const checksum = blake2b512(chkInput).subarray(0, CHECKSUM_BYTES)

  const addressBytes = new Uint8Array(netBytes.length + payload.length + CHECKSUM_BYTES)
  addressBytes.set(netBytes, 0)
  addressBytes.set(payload, netBytes.length)
  addressBytes.set(checksum, netBytes.length + payload.length)

  return base58.encode(addressBytes)
}

export const convertSs58 = <TApi, TRes>(
  api: IPolkadotApi<TApi, TRes>,
  address: string,
  chain: TSubstrateChain
) => {
  const isEvmAddress = isAddress(address)

  if (isEvmAddress && isChainEvm(chain)) {
    return address
  }

  if (isEvmAddress) {
    throw new InvalidAddressError('Cannot convert EVM address to SS58.')
  }

  if (isChainEvm(chain)) {
    throw new InvalidAddressError('Cannot convert SS58 address to EVM.')
  }

  const { ss58Prefix } = getAssetsObject(chain)
  const publicKey = api.accountToUint8a(address)
  return encodeSs58(deriveAccountId(publicKey), ss58Prefix)
}

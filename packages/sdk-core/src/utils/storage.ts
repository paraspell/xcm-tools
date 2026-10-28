import { blake2b } from '@noble/hashes/blake2.js'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js'
import { numberToBytes } from 'viem'

export const blake2128Concat = (hex: string) =>
  bytesToHex(blake2b(hexToBytes(hex), { dkLen: 16 })) + hex

export const toLeHex = (value: number | bigint, size: number) =>
  bytesToHex(numberToBytes(value, { size }).reverse())
